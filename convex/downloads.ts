import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getCurrentUser, requireAdmin, requireAdminSilent } from "./users";
import { auditLog } from "./lib/audit";
import { sanitizeSearch } from "./lib/sanitize";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];
    const downloads = await ctx.db
      .query("downloads")
      .withIndex("by_email", (q) => q.eq("email", me.email))
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      downloads.map(async (d) => {
        const product = await ctx.db.get(d.productId);
        return {
          ...d,
          productName: product?.name ?? "Unknown Product",
          productSlug: product?.slug ?? "",
          productThumbnail: product?.thumbnail,
        };
      })
    );
    return enriched;
  },
});

export const create = internalMutation({
  args: {
    productId: v.id("products"),
    orderId: v.optional(v.id("orders")),
    email: v.string(),
    downloadCount: v.number(),
    remainingDownloads: v.number(),
    expiresAt: v.number(),
    downloadUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    browser: v.optional(v.string()),
    device: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("disabled")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("downloads", {
      ...args,
      revoked: false,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.analytics.recordDownload, { at: now });
    return id;
  },
});

export const recordDownload = mutation({
  args: {
    id: v.id("downloads"),
    browser: v.optional(v.string()),
    device: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("You must be logged in to download");

    const download = await ctx.db.get(args.id);
    if (!download) throw new Error("Download record not found");
    if (download.email !== me.email) throw new Error("Access denied: this download does not belong to you");
    if (download.status !== "active") throw new Error("Download is not active");
    if (download.remainingDownloads <= 0) throw new Error("No downloads remaining");
    if (download.expiresAt < Date.now()) {
      await ctx.db.patch(args.id, { status: "expired" });
      throw new Error("Download link has expired");
    }
    await ctx.db.patch(args.id, {
      downloadCount: download.downloadCount + 1,
      remainingDownloads: download.remainingDownloads - 1,
      browser: args.browser ?? download.browser,
      device: args.device ?? download.device,
      ipAddress: args.ipAddress ?? download.ipAddress,
    });
    // Return a freshly-minted signed URL rather than any stored permanent URL.
    // This keeps the sellable file URL out of queued responses and ensures the
    // served link is tied to the just-validated download grant.
    if (download.storageId) {
      return await ctx.storage.getUrl(download.storageId as Id<"_storage">);
    }
    return download.downloadUrl;
  },
});

/** Preview a product's file after validating a purchase entitlement. */
export const getPreviewUrl = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("You must be logged in");

    // Must hold an active download grant for this product to preview its file.
    const grant = await ctx.db
      .query("downloads")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("email"), me.email))
      .first();
    if (!grant || grant.status !== "active") {
      throw new Error("No active download for this product");
    }
    if (grant.expiresAt < Date.now()) {
      throw new Error("Download has expired");
    }
    const product = await ctx.db.get(args.productId);
    if (!product?.downloadableFileStorageId) {
      throw new Error("No preview available");
    }
    return await ctx.storage.getUrl(product.downloadableFileStorageId as Id<"_storage">);
  },
});

export const revoke = mutation({
  args: { id: v.id("downloads") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const dl = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { status: "disabled", revoked: true });
    await auditLog(ctx, {
      action: "download.revoke",
      entityType: "download",
      entityId: args.id,
      summary: `Revoked download for "${dl?.email ?? "unknown"}"`,
    });
  },
});

export const resetLimit = mutation({
  args: { id: v.id("downloads") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const download = await ctx.db.get(args.id);
    if (download) {
      await ctx.db.patch(args.id, { remainingDownloads: 10 });
      await auditLog(ctx, {
        action: "download.reset_limit",
        entityType: "download",
        entityId: args.id,
        summary: `Reset download limit for "${download.email}"`,
      });
    }
  },
});

export const listAll = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const q = args.status
      ? ctx.db.query("downloads").withIndex("by_status", (q) =>
          q.eq("status", args.status as "active" | "expired" | "disabled")
        )
      : ctx.db.query("downloads");

    const downloads = await q.order("desc").take(100);

    const enriched = await Promise.all(
      downloads.map(async (d) => {
        const product = await ctx.db.get(d.productId);
        return {
          ...d,
          productName: product?.name ?? "Unknown Product",
        };
      })
    );

    if (args.search) {
      const lower = sanitizeSearch(args.search).toLowerCase();
      return enriched.filter(
        (d) =>
          d.email.toLowerCase().includes(lower) ||
          (d.productName && d.productName.toLowerCase().includes(lower))
      );
    }

    return enriched;
  },
});

/** Admin KPI counts across download records. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) {
      return { total: 0, active: 0, expired: 0, disabled: 0, totalDownloads: 0 };
    }
    const all = await ctx.db.query("downloads").collect();
    let active = 0;
    let expired = 0;
    let disabled = 0;
    let totalDownloads = 0;
    for (const d of all) {
      if (d.status === "active") active++;
      else if (d.status === "expired") expired++;
      else if (d.status === "disabled") disabled++;
      totalDownloads += d.downloadCount;
    }
    return { total: all.length, active, expired, disabled, totalDownloads };
  },
});
