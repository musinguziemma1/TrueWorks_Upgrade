import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

export const list = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const q = args.category
      ? ctx.db.query("resources").withIndex("by_category", (q) => q.eq("category", args.category!))
      : args.status
      ? ctx.db.query("resources").withIndex("by_status", (q) => q.eq("status", args.status as "draft" | "published" | "archived"))
      : args.featured !== undefined
      ? ctx.db.query("resources").withIndex("by_featured", (q) => q.eq("featured", args.featured!))
      : ctx.db.query("resources");

    if (args.search) {
      const lower = args.search.toLowerCase();
      const all = await q.collect();
      return all.filter((r) =>
        r.title.toLowerCase().includes(lower) ||
        r.description.toLowerCase().includes(lower) ||
        r.category.toLowerCase().includes(lower)
      );
    }

    return await q.order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("resources")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return results[0] ?? null;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    content: v.string(),
    category: v.string(),
    type: v.union(v.literal("document"), v.literal("video"), v.literal("link"), v.literal("download")),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    featured: v.boolean(),
    externalUrl: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("resources")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    if (existing.length > 0) {
      throw new Error(`Resource with slug "${args.slug}" already exists`);
    }
    const now = Date.now();
    return await ctx.db.insert("resources", {
      ...args,
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("resources"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    type: v.optional(v.union(v.literal("document"), v.literal("video"), v.literal("link"), v.literal("download"))),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    featured: v.optional(v.boolean()),
    externalUrl: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("resources").collect();
    const published = all.filter((r) => r.status === "published").length;
    const draft = all.filter((r) => r.status === "draft").length;
    const archived = all.filter((r) => r.status === "archived").length;
    const totalDownloads = all.reduce((sum, r) => sum + r.downloadCount, 0);
    return { total: all.length, published, draft, archived, totalDownloads };
  },
});
