import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

export const list = query({
  args: {     activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
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
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, { active: true });
      return existing[0]._id;
    }
    return await ctx.db.insert("subscribers", {
      ...args,
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
    await ctx.db.delete(args.id);
  },
});
