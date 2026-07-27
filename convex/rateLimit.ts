import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";

/**
 * Fixed-window rate limiting backed by the rateLimits table.
 *
 * Usage inside any mutation:
 *   await checkRateLimit(ctx, "review", identifier, 5, 60_000);
 * Throws an error when the limit is exceeded.
 */
export async function checkRateLimit(
  ctx: MutationCtx,
  action: string,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<void> {
  const key = `${action}:${identifier}`;
  const now = Date.now();

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();

  if (!existing || now - existing.windowStart > windowMs) {
    // New window
    if (existing) {
      await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    } else {
      await ctx.db.insert("rateLimits", { key, windowStart: now, count: 1 });
    }
    return;
  }

  if (existing.count >= limit) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
}

/**
 * Internal rate limit check for HTTP actions (checkout, webhooks).
 * HTTP actions can't mutate directly, so they run this as an internal mutation.
 */
export const check = internalMutation({
  args: {
    action: v.string(),
    identifier: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    await checkRateLimit(ctx, args.action, args.identifier, args.limit, args.windowMs);
  },
});
