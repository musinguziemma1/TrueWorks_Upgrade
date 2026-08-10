import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal helpers for the refund execution flow. Kept in a separate module so
 * `refunds.ts` (which schedules and runs refunds) can reference them without
 * creating a circular type dependency with `returns.ts`.
 */

export const getByIdInternal = internalQuery({
  args: { id: v.id("returns") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const markCompleted = internalMutation({
  args: { id: v.id("returns"), refundedAt: v.number(), providerResult: v.string() },
  handler: async (ctx, args) => {
    const ret = await ctx.db.get(args.id);
    if (!ret) return;
    await ctx.db.patch(args.id, {
      status: "completed",
      refundedAt: args.refundedAt,
      providerResult: args.providerResult,
      updatedAt: Date.now(),
    });
  },
});
