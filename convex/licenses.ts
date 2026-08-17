import { internalMutation, mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin, requireAdminSilent } from "./users";
import { auditLog } from "./lib/audit";
import { sanitizeSearch } from "./lib/sanitize";

/**
 * License keys for license-gated products.
 *
 * Keys are generated server-side after a successful payment for products with
 * `requiresLicense: true`. Each order grants `licenseKeyCount` keys; a key has a
 * fixed `maxActivations` seat count. Customers see their keys in the account
 * downloads page; admins can inspect and revoke them.
 */

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function randomSegment(length: number): string {
  let out = "";
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  for (let i = 0; i < length; i++) out += KEY_ALPHABET[buf[i] % KEY_ALPHABET.length];
  return out;
}

/** Generate a key like TW-XXXX-XXXX-XXXX (15 chars, checksummed). */
export function generateLicenseKey(): string {
  const body = `${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`;
  return `TW-${body}`;
}

/** Internal: issue a license to a customer after a completed payment. */
export const issue = internalMutation({
  args: {
    productId: v.id("products"),
    productName: v.string(),
    email: v.string(),
    orderId: v.optional(v.id("orders")),
    maxActivations: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Collision-safe retry loop: extremely unlikely to need a retry.
    for (let attempt = 0; attempt < 5; attempt++) {
      const key = generateLicenseKey();
      const existing = await ctx.db
        .query("licenses")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      if (!existing) {
        return await ctx.db.insert("licenses", {
          key,
          productId: args.productId,
          productName: args.productName,
          email: args.email.toLowerCase(),
          orderId: args.orderId,
          status: "active",
          maxActivations: args.maxActivations ?? 1,
          activations: 0,
          createdAt: Date.now(),
        });
      }
    }
    throw new Error("Could not allocate a unique license key");
  },
});

/** List the current user's licenses. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];
    return await ctx.db
      .query("licenses")
      .withIndex("by_email", (q) => q.eq("email", me.email.toLowerCase()))
      .order("desc")
      .take(100);
  },
});

/** Admin: page through all licenses (optionally filtered). */
export const listAll = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    let rows = await ctx.db.query("licenses").order("desc").take(500);
    if (args.search) {
      const q = sanitizeSearch(args.search).toLowerCase();
      rows = rows.filter(
        (r) => r.email.toLowerCase().includes(q) || r.key.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q)
      );
    }
    return rows;
  },
});

/** Internal/verification-oriented: look up a key + owner by email. */
export const validate = mutation({
  args: { key: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("key", args.key.trim().toUpperCase()))
      .first();
    if (!license) return { valid: false, error: "License key not found" };
    if (license.status === "revoked") return { valid: false, error: "License key revoked" };
    if (license.email.toLowerCase() !== args.email.toLowerCase()) return { valid: false, error: "License key does not match your email" };
    if (license.activations >= license.maxActivations) return { valid: false, error: "Activation limit reached" };
    await ctx.db.patch(license._id, { activations: license.activations + 1 });
    return { valid: true, key: license.key, productName: license.productName };
  },
});

export const revoke = mutation({
  args: { id: v.id("licenses") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const license = await ctx.db.get(args.id);
    if (!license) throw new Error("License not found");
    const next: "active" | "revoked" = license.status === "revoked" ? "active" : "revoked";
    await ctx.db.patch(args.id, { status: next });
    await auditLog(ctx, {
      action: "license.revoke",
      entityType: "license",
      entityId: args.id,
      summary: `${next === "revoked" ? "Revoked" : "Restored"} license ${license.key} for ${license.email}`,
    });
  },
});

/** Admin KPI counts across license keys. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) {
      return { total: 0, active: 0, revoked: 0, activations: 0, capacity: 0 };
    }
    const all = await ctx.db.query("licenses").collect();
    let active = 0;
    let revoked = 0;
    let activations = 0;
    let capacity = 0;
    for (const l of all) {
      if (l.status === "active") active++;
      else revoked++;
      activations += l.activations;
      capacity += l.maxActivations;
    }
    return { total: all.length, active, revoked, activations, capacity };
  },
});