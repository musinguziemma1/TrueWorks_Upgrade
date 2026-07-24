import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

export const list = query({
  args: {     unreadOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.unreadOnly) {
      return await ctx.db
        .query("notifications")
        .withIndex("by_read", (q) => q.eq("read", false))
        .collect();
    }
    return await ctx.db.query("notifications").order("desc").take(50);
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_read", (q) => q.eq("read", false))
      .collect();
    return all.length;
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_read", (q) => q.eq("read", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const createPublic = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});
