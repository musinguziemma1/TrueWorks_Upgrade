import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .collect();
    return results[0] ?? null;
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .collect();
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, { value: args.value, updatedAt: Date.now() });
      return existing[0]._id;
    }
    return await ctx.db.insert("settings", {
      key: args.key,
      value: args.value,
      updatedAt: Date.now(),
    });
  },
});
