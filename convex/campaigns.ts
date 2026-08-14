import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireAdmin, requireEditor } from "./users";
import { auditLog } from "./lib/audit";
import { sanitizeSearch } from "./lib/sanitize";

type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

const statusArg = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("sending"),
  v.literal("sent")
);

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(statusArg),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    let all = await ctx.db.query("campaigns").order("desc").collect();
    if (args.status) all = all.filter((c) => c.status === args.status);
    if (args.search) {
      const l = sanitizeSearch(args.search).toLowerCase();
      all = all.filter(
        (c) =>
          c.name.toLowerCase().includes(l) ||
          c.subject.toLowerCase().includes(l)
      );
    }
    const total = all.length;
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    return { campaigns: all.slice(offset, offset + limit), total };
  },
});

export const get = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getInternal = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const markSentInternal = mutation({
  args: { id: v.id("campaigns"), sentCount: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      sentCount: args.sentCount,
      updatedAt: Date.now(),
    });
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("scheduled")),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("campaigns", {
      ...args,
      status: args.status,
      sentCount: 0,
      openCount: 0,
      clickCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    await auditLog(ctx, {
      action: "campaign.create",
      entityType: "campaign",
      entityId: id,
      summary: `Created campaign "${args.name}"`,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(statusArg),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    const old = await ctx.db.get(id);
    if (!old) throw new Error("Campaign not found");
    // Editing a sent campaign would desync its stats — keep it immutable.
    if (old.status === "sent" && filtered.status !== "sent") {
      throw new Error("Sent campaigns can only be duplicated");
    }
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
    await auditLog(ctx, {
      action: "campaign.update",
      entityType: "campaign",
      entityId: id,
      summary: `Updated campaign "${old.name ?? id}"`,
      changes: filtered,
    });
  },
});

export const duplicate = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Campaign not found");
    const now = Date.now();
    const id = await ctx.db.insert("campaigns", {
      name: `${source.name} (copy)`,
      subject: source.subject,
      content: source.content,
      status: "draft",
      sentCount: 0,
      openCount: 0,
      clickCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    await auditLog(ctx, {
      action: "campaign.duplicate",
      entityType: "campaign",
      entityId: id,
      summary: `Duplicated campaign "${source.name}"`,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const campaign = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await auditLog(ctx, {
      action: "campaign.delete",
      entityType: "campaign",
      entityId: args.id,
      summary: `Deleted campaign "${campaign?.name ?? args.id}"`,
    });
  },
});

export const markSent = mutation({
  args: { id: v.id("campaigns"), sentCount: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      sentCount: args.sentCount,
      updatedAt: Date.now(),
    });
  },
});

export const send = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const campaign = await ctx.db.get(args.id);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status === "sent") throw new Error("Campaign already sent");
    if (!campaign.subject.trim()) throw new Error("Campaign needs a subject");
    if (!campaign.content.trim()) throw new Error("Campaign needs content");

    // Mark sending first so the list reflects in-flight delivery and the
    // scheduled-campaign cron skips it.
    await ctx.db.patch(args.id, { status: "sending", updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.email.sendCampaignEmails, {
      campaignId: args.id,
    });

    await ctx.db.insert("notifications", {
      type: "campaign",
      title: "Campaign Sending",
      message: `"${campaign.name}" is queued for delivery to active subscribers.`,
      read: false,
      link: "/admin/email",
      createdAt: Date.now(),
    });

    await auditLog(ctx, {
      action: "campaign.send",
      entityType: "campaign",
      entityId: args.id,
      summary: `Queued campaign "${campaign.name}" for sending`,
    });

    return { queued: true };
  },
});

/**
 * Internal: queue a campaign for delivery without admin auth or notifications.
 * Used by the scheduled-campaign cron. Idempotent per status.
 */
export const queueSend = internalMutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.id);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status === "sent" || campaign.status === "sending") return;
    await ctx.db.patch(args.id, { status: "sending", updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.email.sendCampaignEmails, {
      campaignId: args.id,
    });
  },
});

/** Internal: campaigns in "scheduled" status whose send time has arrived. */
export const listDueScheduled = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const scheduled = await ctx.db
      .query("campaigns")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();
    return scheduled.filter(
      (c) => typeof c.scheduledAt === "number" && c.scheduledAt <= now
    );
  },
});

/** Internal: record a unique open event for a campaign/subscriber pair. */
export const recordOpen = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    subscriberId: v.id("subscribers"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailEvents")
      .withIndex("by_campaign_subscriber", (q) =>
        q.eq("campaignId", args.campaignId).eq("subscriberId", args.subscriberId)
      )
      .collect();
    if (existing.some((e) => e.type === "open")) return;
    await ctx.db.insert("emailEvents", {
      campaignId: args.campaignId,
      subscriberId: args.subscriberId,
      type: "open",
      createdAt: Date.now(),
    });
    const campaign = await ctx.db.get(args.campaignId);
    if (campaign) {
      await ctx.db.patch(args.campaignId, {
        openCount: campaign.openCount + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

/** Internal: record a unique click event for a campaign/subscriber pair. */
export const recordClick = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    subscriberId: v.id("subscribers"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailEvents")
      .withIndex("by_campaign_subscriber", (q) =>
        q.eq("campaignId", args.campaignId).eq("subscriberId", args.subscriberId)
      )
      .collect();
    if (existing.some((e) => e.type === "click")) return;
    await ctx.db.insert("emailEvents", {
      campaignId: args.campaignId,
      subscriberId: args.subscriberId,
      type: "click",
      createdAt: Date.now(),
    });
    const campaign = await ctx.db.get(args.campaignId);
    if (campaign) {
      await ctx.db.patch(args.campaignId, {
        clickCount: campaign.clickCount + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("campaigns").order("desc").collect();
    const subscribers = await ctx.db.query("subscribers").collect();

    const total = all.length;
    const byStatus: Record<CampaignStatus, number> = {
      draft: 0,
      scheduled: 0,
      sending: 0,
      sent: 0,
    };
    for (const c of all) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;

    const totalSent = all.reduce((sum, c) => sum + c.sentCount, 0);
    const totalOpened = all.reduce((sum, c) => sum + c.openCount, 0);
    const totalClicked = all.reduce((sum, c) => sum + c.clickCount, 0);
    const avgOpenRate =
      totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0;
    const avgClickRate =
      totalSent > 0 ? Math.round((totalClicked / totalSent) * 1000) / 10 : 0;

    const activeSubscribers = subscribers.filter((s) => s.active).length;

    // Per-campaign performance for the engagement chart (most recent sent 10).
    const performance = all
      .filter((c) => c.status === "sent")
      .slice(0, 10)
      .map((c) => ({
        _id: c._id,
        name: c.name,
        sentCount: c.sentCount,
        openCount: c.openCount,
        clickCount: c.clickCount,
        openRate: c.sentCount > 0 ? Math.round((c.openCount / c.sentCount) * 1000) / 10 : 0,
        clickRate: c.sentCount > 0 ? Math.round((c.clickCount / c.sentCount) * 1000) / 10 : 0,
        sentAt: c.sentAt ?? null,
      }));

    return {
      total,
      sent: byStatus.sent,
      draft: byStatus.draft,
      scheduled: byStatus.scheduled,
      sending: byStatus.sending,
      byStatus,
      totalSent,
      totalOpened,
      totalClicked,
      avgOpenRate,
      avgClickRate,
      subscribers: subscribers.length,
      activeSubscribers,
      performance,
    };
  },
});
