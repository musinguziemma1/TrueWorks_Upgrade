import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";
import { auditLog } from "./lib/audit";

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("scheduled"), v.literal("sent"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.status) {
      return await ctx.db
        .query("campaigns")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("campaigns").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("sent")),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("campaigns", {
      ...args,
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
    status: v.optional(v.union(v.literal("draft"), v.literal("scheduled"), v.literal("sent"))),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    const old = await ctx.db.get(id);
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
    await auditLog(ctx, {
      action: "campaign.update",
      entityType: "campaign",
      entityId: id,
      summary: `Updated campaign "${old?.name ?? id}"`,
      changes: filtered,
    });
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

export const stats = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("campaigns").collect();
    const total = all.length;
    const sent = all.filter((c) => c.status === "sent").length;
    const draft = all.filter((c) => c.status === "draft").length;
    const scheduled = all.filter((c) => c.status === "scheduled").length;
    const totalSent = all.reduce((sum, c) => sum + c.sentCount, 0);
    const totalOpened = all.reduce((sum, c) => sum + c.openCount, 0);
    const totalClicked = all.reduce((sum, c) => sum + c.clickCount, 0);
    return { total, sent, draft, scheduled, totalSent, totalOpened, totalClicked };
  },
});
