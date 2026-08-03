import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";
import { auditLog } from "./lib/audit";

export const list = query({
  args: { industry: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.industry) {
      const all = await ctx.db.query("categories").collect();
      return all.filter((c) => c.industry === args.industry);
    }
    return await ctx.db.query("categories").order("asc").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return results[0] ?? null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    if (existing.length > 0) {
      throw new Error(`Category with slug "${args.slug}" already exists`);
    }
    const id = await ctx.db.insert("categories", {
      ...args,
      productCount: 0,
      createdAt: Date.now(),
    });
    await auditLog(ctx, {
      action: "category.create",
      entityType: "category",
      entityId: id,
      summary: `Created category "${args.name}"`,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    const old = await ctx.db.get(id);
    await ctx.db.patch(id, filtered);
    await auditLog(ctx, {
      action: "category.update",
      entityType: "category",
      entityId: id,
      summary: `Updated category "${old?.name ?? id}"`,
      changes: filtered,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const cat = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await auditLog(ctx, {
      action: "category.delete",
      entityType: "category",
      entityId: args.id,
      summary: `Deleted category "${cat?.name ?? args.id}"`,
    });
  },
});
