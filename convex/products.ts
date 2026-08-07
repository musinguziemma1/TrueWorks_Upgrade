import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { PaginationOptions } from "convex/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin, requireAdminSilent } from "./users";
import { auditLog, performanceLog } from "./lib/audit";

async function syncCategoryProductCount(ctx: any, categoryName: string) {
  const cats = await ctx.db
    .query("categories")
    .collect();
  const category = cats.find((c: any) => c.name === categoryName);
  if (!category) return;
  const count = await ctx.db
    .query("products")
    .collect()
    .then((ps: any[]) => ps.filter((p: any) => p.category === categoryName).length);
  await ctx.db.patch(category._id, { productCount: count });
}

export const list = query({
  args: {
    category: v.optional(v.string()),
    industry: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await requireAdminSilent(ctx);

    // SECURITY: Non-admins can only see published products
    const status = isAdmin ? args.status : "published";

    const q = args.category
      ? ctx.db.query("products").withIndex("by_category", (q) => q.eq("category", args.category!))
      : args.industry
      ? ctx.db.query("products").withIndex("by_industry", (q) => q.eq("industry", args.industry!))
      : status
      ? ctx.db.query("products").withIndex("by_status", (q) => q.eq("status", status as "draft" | "published" | "archived"))
      : args.featured !== undefined
      ? ctx.db.query("products").withIndex("by_featured", (q) => q.eq("featured", args.featured!))
      : ctx.db.query("products");

    if (args.search) {
      const lower = args.search.toLowerCase();
      const all = await q.collect();
      return all.filter((p) =>
        p.name.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower) ||
        p.shortDescription.toLowerCase().includes(lower)
      );
    }

    return await q.order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    // SECURITY: Non-admins can only see published products
    if (product.status !== "published") {
      const isAdmin = await requireAdminSilent(ctx);
      if (!isAdmin) return null;
    }
    return product;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    const product = results[0] ?? null;
    if (!product) return null;
    // SECURITY: Non-admins can only see published products
    if (product.status !== "published") {
      const isAdmin = await requireAdminSilent(ctx);
      if (!isAdmin) return null;
    }
    return product;
  },
});

/**
 * Server-side paginated product list for the store. Supports filtering
 * by category, industry, and status. Use paginationOpts for cursor.
 */
export const listPaginated = query({
  args: {
    category: v.optional(v.string()),
    industry: v.optional(v.string()),
    status: v.optional(v.string()),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const status = (args.status ?? "published") as "draft" | "published" | "archived";
    const baseQ = ctx.db.query("products").withIndex("by_status", (q) => q.eq("status", status));

    const filtered = args.category
      ? baseQ.filter((q) => q.eq(q.field("category"), args.category!))
      : args.industry
      ? baseQ.filter((q) => q.eq(q.field("industry"), args.industry!))
      : baseQ;

    return await filtered.order("desc").paginate(args.paginationOpts as PaginationOptions);
  },
});

/**
 * Fetch related products by their IDs (set in the admin via
 * relatedProductIds on the source product).
 */
export const getRelatedByIds = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, args) => {
    const docs = await Promise.all(
      args.ids.map((id) => ctx.db.get(id as Id<"products">).catch(() => null))
    );
    return docs.filter((d): d is NonNullable<typeof d> => d !== null && d.status === "published");
  },
});

export const getBundleMembers = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, args) => {
    const docs = await Promise.all(
      args.ids.map((id) => ctx.db.get(id as Id<"products">).catch(() => null))
    );
    return docs.filter((d): d is NonNullable<typeof d> => d !== null && d.status === "published");
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    sku: v.string(),
    shortDescription: v.string(),
    description: v.string(),
    price: v.number(),
    salePrice: v.optional(v.number()),
    pricingTiers: v.optional(v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        salePrice: v.optional(v.number()),
        quantity: v.optional(v.number()),
      })
    )),
    category: v.string(),
    industry: v.string(),
    fileType: v.string(),
    tags: v.array(v.string()),
    galleryImages: v.array(v.string()),
    thumbnail: v.string(),
    downloadableFile: v.optional(v.string()),
    fileSize: v.optional(v.string()),
    version: v.optional(v.string()),
    changelog: v.optional(v.string()),
    downloadLimit: v.optional(v.number()),
    downloadExpiry: v.optional(v.number()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    faqs: v.array(v.object({ question: v.string(), answer: v.string() })),
    demoVideo: v.optional(v.string()),
    featured: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    bundleProductIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    if (existing.length > 0) {
      throw new Error(`Product with slug "${args.slug}" already exists`);
    }
    const now = Date.now();
    const id = await ctx.db.insert("products", {
      ...args,
      totalSales: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    await syncCategoryProductCount(ctx, args.category);
    const identity = await ctx.auth.getUserIdentity();
    const actor = identity ? await ctx.db.query("users").withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first() : null;
    await ctx.db.insert("auditLogs", {
      actorId: actor?._id,
      actorEmail: actor?.email ?? identity?.email ?? "system",
      actorName: actor?.name,
      action: "product.create",
      entityType: "product",
      entityId: id,
      summary: `Created product "${args.name}" (${args.sku})`,
      createdAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    sku: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    pricingTiers: v.optional(v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        salePrice: v.optional(v.number()),
        quantity: v.optional(v.number()),
      })
    )),
    category: v.optional(v.string()),
    industry: v.optional(v.string()),
    fileType: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    galleryImages: v.optional(v.array(v.string())),
    thumbnail: v.optional(v.string()),
    downloadableFile: v.optional(v.string()),
    fileSize: v.optional(v.string()),
    version: v.optional(v.string()),
    changelog: v.optional(v.string()),
    downloadLimit: v.optional(v.number()),
    downloadExpiry: v.optional(v.number()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    faqs: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    demoVideo: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    bundleProductIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const oldProduct = await ctx.db.get(id);
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
    if (updates.category && oldProduct && updates.category !== oldProduct.category) {
      await syncCategoryProductCount(ctx, oldProduct.category);
      await syncCategoryProductCount(ctx, updates.category);
    }
    const identity = await ctx.auth.getUserIdentity();
    const actor = identity ? await ctx.db.query("users").withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first() : null;
    await ctx.db.insert("auditLogs", {
      actorId: actor?._id,
      actorEmail: actor?.email ?? identity?.email ?? "system",
      actorName: actor?.name,
      action: "product.update",
      entityType: "product",
      entityId: id,
      summary: `Updated product "${oldProduct?.name ?? id}"`,
      changes: filtered,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    if (product) {
      await syncCategoryProductCount(ctx, product.category);
    }
    const identity = await ctx.auth.getUserIdentity();
    const actor = identity ? await ctx.db.query("users").withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first() : null;
    await ctx.db.insert("auditLogs", {
      actorId: actor?._id,
      actorEmail: actor?.email ?? identity?.email ?? "system",
      actorName: actor?.name,
      action: "product.delete",
      entityType: "product",
      entityId: args.id,
      summary: `Deleted product "${product?.name ?? args.id}"`,
      createdAt: Date.now(),
    });
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return { total: 0, published: 0, draft: 0, archived: 0, totalRevenue: 0 };
    const all = await ctx.db.query("products").collect();
    const published = all.filter((p) => p.status === "published").length;
    const draft = all.filter((p) => p.status === "draft").length;
    const archived = all.filter((p) => p.status === "archived").length;
    const totalRevenue = all.reduce((sum, p) => sum + p.totalSales * (p.salePrice ?? p.price), 0);
    return { total: all.length, published, draft, archived, totalRevenue };
  },
});

export const bulkImport = mutation({
  args: {
    products: v.array(v.object({
      name: v.string(),
      slug: v.string(),
      sku: v.string(),
      shortDescription: v.string(),
      description: v.string(),
      price: v.number(),
      salePrice: v.optional(v.number()),
      category: v.string(),
      industry: v.string(),
      fileType: v.string(),
      tags: v.array(v.string()),
      galleryImages: v.array(v.string()),
      thumbnail: v.string(),
      downloadableFile: v.optional(v.string()),
      fileSize: v.optional(v.string()),
      version: v.optional(v.string()),
      featured: v.boolean(),
      status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    })),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const start = Date.now();
    const now = Date.now();
    const results: { slug: string; success: boolean; error?: string }[] = [];

    for (const p of args.products) {
      try {
        const existing = await ctx.db
          .query("products")
          .withIndex("by_slug", (q) => q.eq("slug", p.slug))
          .collect();

        if (existing.length > 0) {
          await ctx.db.patch(existing[0]._id, { ...p, updatedAt: now });
          results.push({ slug: p.slug, success: true });
        } else {
          await ctx.db.insert("products", {
            ...p,
            faqs: [],
            totalSales: 0,
            rating: 0,
            reviewCount: 0,
            createdAt: now,
            updatedAt: now,
          });
          results.push({ slug: p.slug, success: true });
        }
      } catch (e) {
        results.push({ slug: p.slug, success: false, error: String(e) });
      }
    }

    const latencyMs = Date.now() - start;
    await auditLog(ctx, {
      action: "product.bulk_import",
      entityType: "product",
      entityId: "bulk",
      summary: `Bulk imported ${args.products.length} products (${results.filter(r => r.success).length} succeeded)`,
      latencyMs,
      source: "mutation",
    });
    if (latencyMs > 3000) {
      await performanceLog(ctx, {
        action: "product.bulk_import",
        entityType: "product",
        entityId: "bulk",
        summary: `Slow bulk import: ${args.products.length} products in ${latencyMs}ms`,
        latencyMs,
        source: "mutation",
      });
    }

    return results;
  },
});
