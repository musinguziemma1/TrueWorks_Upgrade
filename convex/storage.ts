import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { requireAdmin, requireAdminSilent } from "./users";

const ALLOWED_TYPES = new Set([
  // Images
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif",
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword",
  "text/csv", "text/plain",
  // Archives
  "application/zip", "application/x-zip-compressed",
  // Video
  "video/mp4", "video/webm",
]);

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const BLOCKED_EXTENSIONS = new Set([
  "exe", "msi", "bat", "cmd", "com", "scr", "ps1", "vbs", "js", "mjs",
  "html", "htm", "php", "asp", "aspx", "jsp", "sh", "dll",
]);

export const uploadFile = action({
  args: {
    name: v.string(),
    content: v.bytes(),
    contentType: v.string(),
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await ctx.runQuery(api.users.current, {});
    if (!me || (me.role !== "superadmin" && me.role !== "admin" && me.role !== "owner" && me.role !== "editor")) throw new Error("Forbidden");

    // Validate file extension
    const ext = args.name.split(".").pop()?.toLowerCase() ?? "";
    if (BLOCKED_EXTENSIONS.has(ext)) {
      throw new Error(`File type .${ext} is not allowed`);
    }

    // Validate declared content type
    if (!ALLOWED_TYPES.has(args.contentType)) {
      throw new Error(`Content type ${args.contentType} is not allowed`);
    }

    // Validate size
    if (args.content.byteLength > MAX_SIZE_BYTES) {
      throw new Error("File is too large (max 50 MB)");
    }

    const storageId = await ctx.storage.store(new Blob([args.content], { type: args.contentType }));

    const url = (await ctx.storage.getUrl(storageId)) ?? undefined;

    const fileId: Id<"mediaFiles"> = await ctx.runMutation(api.mediaFiles.create, {
      name: args.name,
      contentType: args.contentType,
      folder: args.folder ?? "General",
      size: args.content.byteLength,
      storageId,
      url,
    });

    return { storageId, url, fileId };
  },
});

export const backfillFileUrls = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("mediaFiles").collect();
    let patched = 0;
    for (const f of all) {
      if (!f.url && f.storageId) {
        const url = await ctx.storage.getUrl(f.storageId as Id<"_storage">);
        if (url) {
          await ctx.db.patch(f._id, { url });
          patched++;
        }
      }
    }
    return patched;
  },
});

export const getFileUrl = action({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as Id<"_storage">);
  },
});

export const listFiles = query({
  args: { folder: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    if (args.folder && args.folder !== "") {
      return await ctx.db
        .query("mediaFiles")
        .withIndex("by_folder", (q) => q.eq("folder", args.folder!))
        .collect();
    }
    return await ctx.db.query("mediaFiles").collect();
  },
});

export const deleteFile = mutation({
  args: { id: v.id("mediaFiles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const file = await ctx.db.get(args.id);
    if (file?.storageId) {
      await ctx.storage.delete(file.storageId as Id<"_storage">);
    }
    await ctx.db.delete(args.id);
  },
});
