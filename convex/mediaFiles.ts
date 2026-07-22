import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

export const create = mutation({
  args: {
    name: v.string(),
    contentType: v.string(),
    folder: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("mediaFiles", {
      name: args.name,
      contentType: args.contentType,
      folder: args.folder,
      size: args.size,
      storageId: args.storageId,
      createdAt: Date.now(),
    });
  },
});
