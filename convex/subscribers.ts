import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";
import { checkRateLimit } from "./rateLimit";
import { auditLog } from "./lib/audit";
import { sanitizeSearch } from "./lib/sanitize";

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const all = await ctx.db.query("subscribers").collect();
    if (args.activeOnly) {
      return all.filter((s) => s.active);
    }
    return all;
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("subscribers").collect();
    return all.filter((s) => s.active);
  },
});

/**
 * Paginated subscriber list with search + active filter for the admin page.
 * Kept separate from `list` (array shape) so existing dashboards keep working.
 */
export const listPage = query({
  args: {
    search: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return { subscribers: [], total: 0 };
    let all = await ctx.db.query("subscribers").collect();
    if (args.activeOnly) all = all.filter((s) => s.active);
    if (args.search) {
      const l = sanitizeSearch(args.search).toLowerCase();
      all = all.filter(
        (s) =>
          s.email.toLowerCase().includes(l) ||
          (s.name ?? "").toLowerCase().includes(l) ||
          (s.source ?? "").toLowerCase().includes(l)
      );
    }
    all.sort((a, b) => b.createdAt - a.createdAt);
    const total = all.length;
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    return { subscribers: all.slice(offset, offset + limit), total };
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    // Rate limit: max 5 subscribe attempts per email per hour
    await checkRateLimit(ctx, "subscribe", email, 5, 3_600_000);

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (existing.length > 0) {
      const wasInactive = !existing[0].active;
      await ctx.db.patch(existing[0]._id, { active: true });
      // Send welcome-back email if re-subscribing
      if (wasInactive) {
        await ctx.scheduler.runAfter(0, internal.email.sendSubscriberWelcome, {
          subscriberEmail: email,
          subscriberName: args.name,
        });
      }
      return existing[0]._id;
    }
    const id = await ctx.db.insert("subscribers", {
      ...args,
      email,
      active: true,
      createdAt: Date.now(),
    });
    // Send welcome email to new subscribers
    await ctx.scheduler.runAfter(0, internal.email.sendSubscriberWelcome, {
      subscriberEmail: email,
      subscriberName: args.name,
    });
    // Notify admin
    await ctx.db.insert("notifications", {
      type: "subscriber",
      title: "New Subscriber",
      message: `${args.name || email} subscribed to the newsletter${args.source ? ` from ${args.source}` : ""}.`,
      read: false,
      link: "/admin/email",
      createdAt: Date.now(),
    });
    return id;
  },
});

export const unsubscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Rate limit: max 5 unsubscribe attempts per email per hour
    await checkRateLimit(ctx, "unsubscribe", email, 5, 3_600_000);

    const results = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    if (results.length > 0) {
      await ctx.db.patch(results[0]._id, { active: false });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("subscribers") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const sub = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await auditLog(ctx, {
      action: "subscriber.remove",
      entityType: "subscriber",
      entityId: args.id,
      summary: `Removed subscriber "${sub?.email ?? "unknown"}"`,
    });
  },
});
