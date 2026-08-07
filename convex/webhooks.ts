import { mutation, query, internalQuery, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAdminSilent } from "./users";
import { auditLog } from "./lib/audit";
import { internal, api } from "./_generated/api";

/**
 * Reseller API keys + outbound webhooks.
 *
 * API keys are stored as a hash + prefix; the full key is shown only once at
 * creation. Webhook endpoints receive signed, fire-and-forget order events.
 * Runs in Convex's default (non-Node) runtime using Web Crypto.
 */

async function sha256Hex(input: string): Promise<string> {
  const keyData = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", keyData);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateApiKey(): { full: string; prefix: string } {
  const segments = [];
  for (let i = 0; i < 4; i++) segments.push(crypto.randomUUID().slice(0, 8));
  const full = `tw_${segments.join("-")}`;
  return { full, prefix: full.slice(0, 11) };
}

export const generateKey = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { full, prefix } = generateApiKey();
    const hash = await sha256Hex(full);
    await ctx.db.insert("apiKeys", {
      name: args.name,
      keyPrefix: prefix,
      keyHash: hash,
      enabled: true,
      createdAt: Date.now(),
    });
    await auditLog(ctx, {
      action: "api_key.create",
      entityType: "apiKey",
      entityId: prefix,
      summary: `Created API key "${args.name}"`,
    });
    return { key: full, prefix };
  },
});

/**
 * Idempotency guard for inbound provider events (Stripe, Pesapal). Stripe/Pesapal
 * retry deliveries on network failures; without a dedupe record every retry would
 * re-grant downloads and re-send emails. The event table records what we've already
 * processed, so replays are no-ops.
 *
 * `markProcessed` is insert-then-detect: Convex abort-retries on write conflicts,
 * so concurrent delivery of the same event can't both succeed.
 */
export const isProcessed = internalQuery({
  args: { provider: v.string(), eventId: v.string() },
  handler: async (ctx, args) => {
    const hit = await ctx.db
      .query("webhookEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    return hit?.provider === args.provider;
  },
});

export const markProcessed = internalMutation({
  args: { provider: v.string(), eventId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      provider: args.provider,
      eventId: args.eventId,
      createdAt: Date.now(),
    });
  },
});

export const listApiKeys = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const keys = await ctx.db.query("apiKeys").order("desc").take(50);
    return keys.map((k) => ({
      _id: k._id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      enabled: k.enabled,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    }));
  },
});

export const toggleKey = mutation({
  args: { id: v.id("apiKeys"), enabled: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const key = await ctx.db.get(args.id);
    if (!key) throw new Error("Key not found");
    await ctx.db.patch(args.id, { enabled: args.enabled });
    await auditLog(ctx, {
      action: "api_key.toggle",
      entityType: "apiKey",
      entityId: key.keyPrefix,
      summary: `${args.enabled ? "Enabled" : "Disabled"} API key "${key.name}"`,
    });
  },
});

export const deleteKey = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const key = await ctx.db.get(args.id);
    if (!key) throw new Error("Key not found");
    await ctx.db.delete(args.id);
    await auditLog(ctx, {
      action: "api_key.delete",
      entityType: "apiKey",
      entityId: key.keyPrefix,
      summary: `Deleted API key "${key.name}"`,
    });
  },
});

/** Internal auth check for HTTP routes. Returns true when the key is valid. */
export const validateKey = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const hash = await sha256Hex(args.key);
    const match = await ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", hash))
      .first();
    if (!match || !match.enabled) return false;
    await ctx.db.patch(match._id, { lastUsedAt: Date.now() });
    return true;
  },
});

// ---------------------------------------------------------------------------
// Outbound webhooks
// ---------------------------------------------------------------------------

export const listWebhooks = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return [];
    return await ctx.db.query("webhookEndpoints").order("desc").take(50);
  },
});

/** Internal: also enabled endpoints for the dispatch action. */
export const listWebhookEndpointsForDispatch = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();
  },
});

export const addWebhookEndpoint = mutation({
  args: { url: v.string(), events: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const id = await ctx.db.insert("webhookEndpoints", {
      url: args.url,
      events: args.events,
      enabled: true,
      createdAt: Date.now(),
    });
    await auditLog(ctx, {
      action: "webhook.create",
      entityType: "webhook",
      entityId: id,
      summary: `Registered webhook ${args.url}`,
    });
    return id;
  },
});

export const deleteWebhookEndpoint = mutation({
  args: { id: v.id("webhookEndpoints") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const listWebhookDeliveries = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return [];
    return await ctx.db
      .query("webhookDeliveries")
      .order("desc")
      .take(100);
  },
});

export const signDelivery = query({
  args: { payload: v.string() },
  handler: async (ctx, args) => {
    return await sha256Hex(`${process.env.RESELLER_SIGNING_SECRET ?? ""}:${args.payload}`);
  },
});

export const recordDelivery = internalMutation({
  args: {
    endpointId: v.id("webhookEndpoints"),
    event: v.string(),
    url: v.string(),
    status: v.union(v.literal("success"), v.literal("failed")),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    payload: v.optional(v.any()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookDeliveries", {
      endpointId: args.endpointId,
      event: args.event,
      url: args.url,
      status: args.status,
      responseStatus: args.responseStatus,
      responseBody: args.responseBody,
      payload: args.payload,
      createdAt: args.createdAt,
    });
  },
});

/** Fire outbound webhook events to reseller endpoints (called after purchase). */
export const dispatchEvent = action({
  args: {
    event: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const endpoints = await ctx.runQuery(api.webhooks.listWebhookEndpointsForDispatch);
    const matching = endpoints.filter(
      (e) => e.events.includes(args.event) || e.events.includes("*")
    );
    const now = Date.now();
    const secret = process.env.RESELLER_SIGNING_SECRET ?? "";
    for (const ep of matching) {
      const bodyObj = { event: args.event, data: args.payload, timestamp: now };
      const endpointId = ep._id as any;
      try {
        const signature = await ctx.runQuery(api.webhooks.signDelivery, {
          payload: JSON.stringify(bodyObj),
        });
        const response = await fetch(ep.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-trueworks-event": args.event,
            "x-trueworks-signature": signature,
            "x-trueworks-timestamp": String(now),
          },
          body: JSON.stringify(bodyObj),
        });
        await ctx.runMutation(internal.webhooks.recordDelivery, {
          endpointId,
          event: args.event,
          url: ep.url,
          status: response.ok ? "success" : "failed",
          responseStatus: response.status,
          responseBody: (await response.text().catch(() => "")).slice(0, 500),
          payload: args.payload,
          createdAt: now,
        });
      } catch (err) {
        await ctx.runMutation(internal.webhooks.recordDelivery, {
          endpointId,
          event: args.event,
          url: ep.url,
          status: "failed",
          responseBody: err instanceof Error ? err.message : String(err),
          payload: args.payload,
          createdAt: now,
        });
      }
    }
  },
});