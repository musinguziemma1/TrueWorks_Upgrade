import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { requireAdmin } from "./users";

export const uploadFile = action({
  args: {
    name: v.string(),
    content: v.bytes(),
    contentType: v.string(),
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await ctx.runQuery(api.users.current, {});
    if (!me || me.role !== "admin") throw new Error("Forbidden");
    const storageId = await ctx.storage.store(new Blob([args.content]));

    const fileId: Id<"mediaFiles"> = await ctx.runMutation(api.mediaFiles.create, {
      name: args.name,
      contentType: args.contentType,
      folder: args.folder ?? "General",
      size: args.content.byteLength,
      storageId,
    });

    const url = await ctx.storage.getUrl(storageId);
    return { storageId, url, fileId };
  },
});

export const getFileUrl = action({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as Id<"_storage">);
  },
});

export const listFiles = query({
  args: {     folder: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("mediaFiles").collect();
    if (args.folder && args.folder !== "") {
      return all.filter((f) => f.folder === args.folder);
    }
    return all;
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
