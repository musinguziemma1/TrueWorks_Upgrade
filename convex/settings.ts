import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";

// Strips anything that could break out of a <style> tag or execute script
export function sanitizeCss(css: string): string {
  return css
    .replace(/<\/style/gi, "")
    .replace(/<style/gi, "")
    .replace(/<script/gi, "")
    .replace(/<\/script/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/@import/gi, "")
    .replace(/behavior\s*:/gi, "")
    .replace(/-moz-binding/gi, "");
}

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .collect();
    return results[0] ?? null;
  },
});

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("settings").collect();
    const result: Record<string, unknown> = {};
    const publicKeys = [
      "siteName", "siteTagline", "siteDescription", "siteUrl",
      "primaryColor", "secondaryColor", "accentColor", "backgroundColor",
      "surfaceColor", "foregroundColor", "headingFont", "bodyFont", "customCss",
      "currency", "taxRate", "pesapalEnabled",
    ];
    for (const setting of all) {
      if (publicKeys.includes(setting.key)) {
        result[setting.key] =
          setting.key === "customCss" && typeof setting.value === "string"
            ? sanitizeCss(setting.value)
            : setting.value;
      }
    }
    return result;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return {};
    const all = await ctx.db.query("settings").collect();
    const result: Record<string, unknown> = {};
    for (const setting of all) {
      result[setting.key] = setting.value;
    }
    return result;
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .collect();
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, { value: args.value, updatedAt: Date.now() });
      const { auditLog } = await import("./lib/audit");
      await auditLog(ctx, {
        action: "settings.update",
        entityType: "settings",
        entityId: existing[0]._id,
        summary: `Updated setting "${args.key}"`,
        changes: { key: args.key, value: args.value },
      });
      return existing[0]._id;
    }
    const id = await ctx.db.insert("settings", {
      key: args.key,
      value: args.value,
      updatedAt: Date.now(),
    });
    const { auditLog } = await import("./lib/audit");
    await auditLog(ctx, {
      action: "settings.create",
      entityType: "settings",
      entityId: id,
      summary: `Created setting "${args.key}"`,
      changes: { key: args.key, value: args.value },
    });
    return id;
  },
});

export const setMultiple = mutation({
  args: {
    settings: v.array(v.object({ key: v.string(), value: v.any() })),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const keys: string[] = [];
    for (const { key, value } of args.settings) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .collect();
      if (existing.length > 0) {
        await ctx.db.patch(existing[0]._id, { value, updatedAt: Date.now() });
      } else {
        await ctx.db.insert("settings", { key, value, updatedAt: Date.now() });
      }
      keys.push(key);
    }
    const { auditLog } = await import("./lib/audit");
    await auditLog(ctx, {
      action: "settings.bulk_update",
      entityType: "settings",
      entityId: "bulk",
      summary: `Bulk updated ${keys.length} settings: ${keys.join(", ")}`,
    });
  },
});

export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .collect();
    if (existing.length > 0) {
      await ctx.db.delete(existing[0]._id);
    }
  },
});
