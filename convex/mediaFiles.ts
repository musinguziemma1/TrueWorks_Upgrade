import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";
import { auditLog } from "./lib/audit";

export const create = mutation({
  args: {
    name: v.string(),
    contentType: v.string(),
    folder: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const id = await ctx.db.insert("mediaFiles", {
      name: args.name,
      contentType: args.contentType,
      folder: args.folder,
      size: args.size,
      storageId: args.storageId,
      url: args.url,
      createdAt: Date.now(),
    });
    await auditLog(ctx, {
      action: "media.upload",
      entityType: "mediaFile",
      entityId: id,
      summary: `Uploaded file "${args.name}"`,
    });
    return id;
  },
});
