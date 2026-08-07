import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent, requireEditor } from "./users";
import { auditLog } from "./lib/audit";

export const list = query({
  args: { type: v.optional(v.union(v.literal("page"), v.literal("post"), v.literal("resource"))) },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const q = args.type
      ? ctx.db.query("pages").withIndex("by_type", (q) => q.eq("type", args.type!))
      : ctx.db.query("pages");
    return await q.order("desc").collect();
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
    await requireEditor(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("pages", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    await auditLog(ctx, {
      action: "page.create",
      entityType: "page",
      entityId: id,
      summary: `Created ${args.type} "${args.title}"`,
    });
    return id;
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
    await requireEditor(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    const old = await ctx.db.get(id);
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
    await auditLog(ctx, {
      action: "page.update",
      entityType: "page",
      entityId: id,
      summary: `Updated ${old?.type ?? "page"} "${old?.title ?? id}"`,
      changes: filtered,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("pages") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const page = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await auditLog(ctx, {
      action: "page.delete",
      entityType: "page",
      entityId: args.id,
      summary: `Deleted ${page?.type ?? "page"} "${page?.title ?? args.id}"`,
    });
  },
});
