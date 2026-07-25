import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";

export const list = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    if (args.type) {
      return await ctx.db
        .query("pages")
        .withIndex("by_type", (q) => q.eq("type", args.type as "page" | "post" | "resource"))
        .collect();
    }
    if (args.status) {
      return await ctx.db
        .query("pages")
        .withIndex("by_status", (q) => q.eq("status", args.status as "draft" | "published"))
        .collect();
    }
    return await ctx.db.query("pages").order("desc").take(100);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("pages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return results[0] ?? null;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    type: v.union(v.literal("page"), v.literal("post"), v.literal("resource")),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    author: v.optional(v.string()),
    readingTime: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    return await ctx.db.insert("pages", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("pages"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(v.union(v.literal("page"), v.literal("post"), v.literal("resource"))),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    author: v.optional(v.string()),
    readingTime: v.optional(v.number()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("pages") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
