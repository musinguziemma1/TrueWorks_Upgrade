import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireAdmin, requireAdminSilent } from "./users";
import { auditLog } from "./lib/audit";
import {
  SETTING_BY_KEY,
  PUBLIC_SETTING_KEYS,
  SECRET_MASK,
  isSecretKey,
  validateSettingValue,
} from "./settingsSchema";

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

async function getSettingDoc(ctx: QueryCtx | MutationCtx, key: string) {
  return ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
}

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return null;
    const existing = await getSettingDoc(ctx, args.key);
    if (!existing) return null;
    if (isSecretKey(args.key)) {
      return existing.value ? SECRET_MASK : "";
    }
    return existing.value;
  },
});

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("settings").collect();
    const result: Record<string, unknown> = {};
    for (const setting of all) {
      if ((PUBLIC_SETTING_KEYS as readonly string[]).includes(setting.key)) {
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
      // Secrets are masked so their real values never reach the browser.
      result[setting.key] = isSecretKey(setting.key) ? (setting.value ? SECRET_MASK : "") : setting.value;
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
    // Whitelist + validate against the shared schema.
    const field = SETTING_BY_KEY[args.key];
    if (!field) {
      throw new Error(`Unknown setting key: ${args.key}`);
    }
    const check = validateSettingValue(args.key, args.value);
    if (!check.ok) throw new Error(check.error);

    let value: unknown = check.value;
    if (args.key === "customCss" && typeof value === "string") value = sanitizeCss(value);

    const existing = await getSettingDoc(ctx, args.key);
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: Date.now() });
      await auditLog(ctx, {
        action: "settings.update",
        entityType: "settings",
        entityId: existing._id,
        summary: `Updated setting "${args.key}"`,
        changes: { key: args.key },
      });
      return existing._id;
    }
    const id = await ctx.db.insert("settings", {
      key: args.key,
      value,
      updatedAt: Date.now(),
    });
    await auditLog(ctx, {
      action: "settings.create",
      entityType: "settings",
      entityId: id,
      summary: `Created setting "${args.key}"`,
      changes: { key: args.key },
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
    const invalid: string[] = [];

    for (const { key, value } of args.settings) {
      const field = SETTING_BY_KEY[key];
      if (!field) {
        invalid.push(key);
        continue;
      }
      // Empty string for a secret field means "keep the current value".
      if (field.secret && value === "") continue;

      const check = validateSettingValue(key, value);
      if (!check.ok) {
        invalid.push(key);
        continue;
      }
      let coerced: unknown = check.value;
      if (key === "customCss" && typeof coerced === "string") coerced = sanitizeCss(coerced);

      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .collect();
      if (existing.length > 0) {
        await ctx.db.patch(existing[0]._id, { value: coerced, updatedAt: Date.now() });
      } else {
        await ctx.db.insert("settings", { key, value: coerced, updatedAt: Date.now() });
      }
      keys.push(key);
    }

    if (invalid.length > 0) {
      throw new Error(`Invalid or unknown settings: ${invalid.join(", ")}`);
    }

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
    const existing = await getSettingDoc(ctx, args.key);
    if (existing) {
      await ctx.db.delete(existing._id);
      await auditLog(ctx, {
        action: "settings.delete",
        entityType: "settings",
        entityId: existing._id,
        summary: `Deleted setting "${args.key}"`,
      });
    }
  },
});

/**
 * Generate a new API key server-side using a CSPRNG. The key is returned to
 * the caller exactly once and stored as a secret (masked in getAll).
 */
export const generateApiKey = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const key = `twk_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;

    const existing = await getSettingDoc(ctx, "apiKey");
    if (existing) {
      await ctx.db.patch(existing._id, { value: key, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("settings", { key: "apiKey", value: key, updatedAt: Date.now() });
    }
    await auditLog(ctx, {
      action: "settings.update",
      entityType: "settings",
      entityId: existing?._id ?? "apiKey",
      summary: "Regenerated API key",
    });
    return key;
  },
});

/** Internal (server-only) helpers — used by actions that cache secrets/tokens. */
export const getInternal = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const existing = await getSettingDoc(ctx, args.key);
    return existing?.value ?? null;
  },
});

export const setInternal = internalMutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const existing = await getSettingDoc(ctx, args.key);
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("settings", { key: args.key, value: args.value, updatedAt: Date.now() });
    }
  },
});

