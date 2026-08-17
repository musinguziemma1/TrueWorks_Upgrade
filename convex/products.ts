import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  paginationOptsValidator,
  type Expression,
  type FilterBuilder,
  type NamedTableInfo,
  type OrderedQuery,
} from "convex/server";
import { Doc, Id, type DataModel } from "./_generated/dataModel";
import { requireAdmin, requireAdminSilent, requireEditor } from "./users";
import { auditLog, performanceLog } from "./lib/audit";
import { sanitizeSearch, sanitizeText, pickFromWhitelist } from "./lib/sanitize";

const PRODUCT_STATUS = ["draft", "published", "archived"] as const;
const PRODUCT_SORT = [
  "newest",
  "popular",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
] as const;

type ProductsInfo = NamedTableInfo<DataModel, "products">;

/**
 * SECURITY: The permanent storage URL (downloadableFile) must never reach the
 * browser for non-admin callers — it is the sellable content and would let
 * anyone download the paid file without purchasing. Public payloads expose a
 * boolean `hasDownloadableFile` instead; actual URLs are minted on demand via
 * signed, server-checked download/preview functions.
 */
type PublicProduct = Omit<Doc<"products">, "downloadableFile"> & {
  downloadableFile?: string | undefined;
  hasDownloadableFile: boolean;
};

function publicProduct(p: Doc<"products">): PublicProduct {
  const { downloadableFile, ...rest } = p;
  return { ...rest, hasDownloadableFile: !!(p.downloadableFileStorageId ?? downloadableFile) };
}

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

    // SECURITY: Non-admins can only see published products. Admin-supplied
    // status is normalized against the whitelist so arbitrary strings are
    // rejected rather than interpreted.
    const rawStatus = sanitizeText(args.status);
    const status = isAdmin
      ? pickFromWhitelist(rawStatus, PRODUCT_STATUS, "published")
      : "published";

    const q = args.category
      ? ctx.db.query("products").withIndex("by_category", (q) => q.eq("category", sanitizeText(args.category!)))
      : args.industry
      ? ctx.db.query("products").withIndex("by_industry", (q) => q.eq("industry", sanitizeText(args.industry!)))
      : status
      ? ctx.db.query("products").withIndex("by_status", (q) => q.eq("status", status))
      : args.featured !== undefined
      ? ctx.db.query("products").withIndex("by_featured", (q) => q.eq("featured", args.featured!))
      : ctx.db.query("products");

    if (args.search) {
      const lower = sanitizeSearch(args.search).toLowerCase();
      const all = await q.collect();
      const filtered = all.filter((p) =>
        p.name.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower) ||
        p.shortDescription.toLowerCase().includes(lower)
      );
      return isAdmin ? filtered : filtered.map((p) => publicProduct(p));
    }

    const rows = await q.order("desc").take(100);
    return isAdmin ? rows : rows.map((p) => publicProduct(p));
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
    const isAdmin = await requireAdminSilent(ctx);
    return isAdmin ? product : publicProduct(product);
  },
});

/** Internal: full product incl. sellable file metadata for payment webhooks. */
export const getByIdInternal = internalQuery({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
    const isAdmin = await requireAdminSilent(ctx);
    return isAdmin ? product : publicProduct(product);
  },
});

/**
 * Server-side paginated product list for the store. All filter/sort logic runs
 * inside Convex so the client only loads pages. Non-admin callers are always
 * restricted to published products and never receive the sellable file URL.
 */
export const listPaginated = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    industries: v.optional(v.array(v.string())),
    fileTypes: v.optional(v.array(v.string())),
    onSale: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    minRating: v.optional(v.number()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sort: v.optional(v.string()),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const isAdmin = await requireAdminSilent(ctx);
    const status = isAdmin
      ? pickFromWhitelist(sanitizeText(args.status), PRODUCT_STATUS, "published")
      : "published";

    const buildConds = (qb: FilterBuilder<ProductsInfo>): Expression<boolean>[] => {
      const c: Expression<boolean>[] = [];
      if (args.category) c.push(qb.eq(qb.field("category"), sanitizeText(args.category)));
      if (args.industries?.length)
        c.push(qb.or(...args.industries.map((i) => qb.eq(qb.field("industry"), sanitizeText(i)))));
      if (args.fileTypes?.length)
        c.push(qb.or(...args.fileTypes.map((f) => qb.eq(qb.field("fileType"), sanitizeText(f)))));
      if (args.onSale)
        c.push(qb.and(qb.neq(qb.field("salePrice"), undefined), qb.lt(qb.field("salePrice"), qb.field("price"))));
      if (args.featured) c.push(qb.eq(qb.field("featured"), true));
      if (args.minRating) c.push(qb.gte(qb.field("rating"), args.minRating));
      if (args.minPrice)
        c.push(
          qb.or(
            qb.and(qb.eq(qb.field("salePrice"), undefined), qb.gte(qb.field("price"), args.minPrice)),
            qb.and(qb.neq(qb.field("salePrice"), undefined), qb.gte(qb.field("salePrice"), args.minPrice))
          )
        );
      if (args.maxPrice)
        c.push(
          qb.or(
            qb.and(qb.eq(qb.field("salePrice"), undefined), qb.lte(qb.field("price"), args.maxPrice)),
            qb.and(qb.neq(qb.field("salePrice"), undefined), qb.lte(qb.field("salePrice"), args.maxPrice))
          )
        );
      return c;
    };

    const baseQuery = () => ctx.db.query("products");

    const searchTerm = sanitizeSearch(args.search);
    const sort = pickFromWhitelist(args.sort, PRODUCT_SORT, "newest");
    const useStatusIndex = sort === "newest";
    const order = (useStatusIndex
      ? "desc"
      : sort === "price-asc" || sort === "name-asc"
      ? "asc"
      : "desc") as "asc" | "desc";

    // Ordering must be applied before the cursor is stable for pagination.
    let base: OrderedQuery<ProductsInfo>;
    if (searchTerm) {
      base = baseQuery()
        .withSearchIndex("search_products", (sq) => sq.search("name", searchTerm).eq("status", status))
        .filter((qb) => {
          const c = buildConds(qb);
          return c.length ? qb.and(...c) : true;
        });
    } else {
      const idx = (useStatusIndex
        ? "by_status"
        : sort === "popular"
        ? "by_total_sales"
        : sort === "price-asc" || sort === "price-desc"
        ? "by_price"
        : sort === "name-asc" || sort === "name-desc"
        ? "by_name"
        : "by_rating") as "by_status" | "by_total_sales" | "by_price" | "by_name" | "by_rating";
      base = baseQuery()
        .withIndex(idx)
        .order(order)
        .filter((qb) => {
          const c = buildConds(qb);
          c.push(qb.eq(qb.field("status"), status));
          return qb.and(...c);
        });
    }

    const page = await base.paginate(args.paginationOpts);
    return {
      ...page,
      page: isAdmin ? page.page : page.page.map((p) => publicProduct(p)),
    };
  },
});

/**
 * Aggregate counts/prices across published products for the store sidebar
 * (category/industry/file-type counts, min/max price, sale/featured counts).
 */
export const getStoreFacets = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const categoryCounts: Record<string, number> = {};
    const industryCounts: Record<string, number> = {};
    const fileTypeCounts: Record<string, number> = {};
    let saleCount = 0;
    let featuredCount = 0;
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const p of rows) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      if (p.industry) industryCounts[p.industry] = (industryCounts[p.industry] || 0) + 1;
      if (p.fileType) fileTypeCounts[p.fileType] = (fileTypeCounts[p.fileType] || 0) + 1;
      if (p.salePrice) saleCount++;
      if (p.featured) featuredCount++;
      const price = p.salePrice ?? p.price;
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    }

    return {
      total: rows.length,
      categoryCounts,
      industryCounts,
      fileTypeCounts,
      saleCount,
      featuredCount,
minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
    };
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
    downloadableFileStorageId: v.optional(v.id("_storage")),
    fileSize: v.optional(v.string()),
    version: v.optional(v.string()),
    changelog: v.optional(v.string()),
    downloadLimit: v.optional(v.number()),
    downloadExpiry: v.optional(v.number()),
    requiresLicense: v.optional(v.boolean()),
    licenseKeyCount: v.optional(v.number()),
    activationLimit: v.optional(v.number()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    faqs: v.array(v.object({ question: v.string(), answer: v.string() })),
    demoVideo: v.optional(v.string()),
    featured: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    bundleProductIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
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
    downloadableFileStorageId: v.optional(v.id("_storage")),
    fileSize: v.optional(v.string()),
    version: v.optional(v.string()),
    changelog: v.optional(v.string()),
    downloadLimit: v.optional(v.number()),
    downloadExpiry: v.optional(v.number()),
    requiresLicense: v.optional(v.boolean()),
    licenseKeyCount: v.optional(v.number()),
    activationLimit: v.optional(v.number()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    faqs: v.optional(v.array(v.object({ question: v.string(), answer: v.string() }))),
    demoVideo: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    bundleProductIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
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

/** Set the status of many products at once (admin bulk action). */
export const bulkSetStatus = mutation({
  args: {
    ids: v.array(v.id("products")),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    await requireEditor(ctx);
    const now = Date.now();
    let changed = 0;
    for (const id of args.ids) {
      const product = await ctx.db.get(id);
      if (!product || product.status === args.status) continue;
      await ctx.db.patch(id, { status: args.status, updatedAt: now });
      changed++;
    }
    const identity = await ctx.auth.getUserIdentity();
    const actor = identity ? await ctx.db.query("users").withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first() : null;
    await ctx.db.insert("auditLogs", {
      actorId: actor?._id,
      actorEmail: actor?.email ?? identity?.email ?? "system",
      actorName: actor?.name,
      action: "product.bulkStatus",
      entityType: "product",
      entityId: args.ids[0],
      summary: `Bulk set ${changed}/${args.ids.length} products to "${args.status}"`,
      createdAt: now,
    });
    return changed;
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
