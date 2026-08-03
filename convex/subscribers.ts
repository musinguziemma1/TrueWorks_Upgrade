import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";
import { checkRateLimit } from "./rateLimit";

export const list = query({
  args: {     activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const all = await ctx.db.query("subscribers").collect();
    if (args.activeOnly) {
      return all.filter((s) => s.active);
    }
    return all;
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
      await ctx.db.patch(existing[0]._id, { active: true });
      return existing[0]._id;
    }
    return await ctx.db.insert("subscribers", {
      ...args,
      email,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const unsubscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
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
    const { auditLog } = await import("./lib/audit");
    await auditLog(ctx, {
      action: "subscriber.remove",
      entityType: "subscriber",
      entityId: args.id,
      summary: `Removed subscriber "${sub?.email ?? "unknown"}"`,
    });
  },
});
