import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin } from "./users";

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

export const create = mutation({
  args: {
    productId: v.id("products"),
    orderId: v.optional(v.id("orders")),
    email: v.string(),
    downloadCount: v.number(),
    remainingDownloads: v.number(),
    expiresAt: v.number(),
    downloadUrl: v.optional(v.string()),
    browser: v.optional(v.string()),
    device: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("disabled")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("downloads", {
      ...args,
      revoked: false,
      createdAt: now,
    });
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
    const download = await ctx.db.get(args.id);
    if (!download) throw new Error("Download record not found");
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
    return download.downloadUrl;
  },
});

export const revoke = mutation({
  args: { id: v.id("downloads") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: "disabled", revoked: true });
  },
});

export const resetLimit = mutation({
  args: { id: v.id("downloads") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const download = await ctx.db.get(args.id);
    if (download) {
      await ctx.db.patch(args.id, { remainingDownloads: 10 });
    }
  },
});

export const listAll = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
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
      const lower = args.search.toLowerCase();
      return enriched.filter(
        (d) =>
          d.email.toLowerCase().includes(lower) ||
          (d.productName && d.productName.toLowerCase().includes(lower))
      );
    }

    return enriched;
  },
});
