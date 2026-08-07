import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSilent } from "./users";

export const track = mutation({
  args: {
    email: v.string(),
    items: v.array(v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
      image: v.string(),
      slug: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    if (args.items.length === 0) return;

    const email = args.email.toLowerCase().trim();
    const totalValue = args.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Check if there's an existing unrecovered cart for this email
    const existing = await ctx.db
      .query("abandonedCarts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("recovered"), false))
      .order("desc")
      .first();

    if (existing) {
      // Update existing cart
      await ctx.db.patch(existing._id, {
        items: args.items,
        totalValue,
        updatedAt: Date.now(),
      });
    } else {
      // Create new abandoned cart record
      await ctx.db.insert("abandonedCarts", {
        email,
        items: args.items,
        totalValue,
        recovered: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const markRecovered = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const carts = await ctx.db
      .query("abandonedCarts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("recovered"), false))
      .collect();

    for (const cart of carts) {
      await ctx.db.patch(cart._id, { recovered: true, updatedAt: Date.now() });
    }
  },
});

export const list = query({
  args: {
    recoveredOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // SECURITY: abandoned-cart data contains customer emails + cart contents.
    // Only admins may enumerate it.
    if (!(await requireAdminSilent(ctx))) return [];
    const all = await ctx.db
      .query("abandonedCarts")
      .order("desc")
      .take(100);

    if (args.recoveredOnly) {
      return all.filter((c) => c.recovered);
    }
    return all;
  },
});

/** Internal: enumerate abandoned carts for the recovery cron. */
export const listInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("abandonedCarts").order("desc").collect();
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await requireAdminSilent(ctx))) return {
      total: 0, recovered: 0, pending: 0, totalValue: 0, recoveredValue: 0, recoveryRate: 0, emailsSent: 0,
    };
    const all = await ctx.db.query("abandonedCarts").collect();
    const recovered = all.filter((c) => c.recovered);
    const totalValue = all.reduce((sum, c) => sum + c.totalValue, 0);
    const recoveredValue = recovered.reduce((sum, c) => sum + c.totalValue, 0);
    const emailsSent = all.filter((c) => c.recoveryEmailSentAt).length;

    return {
      total: all.length,
      recovered: recovered.length,
      pending: all.length - recovered.length,
      totalValue,
      recoveredValue,
      recoveryRate: all.length > 0 ? Math.round((recovered.length / all.length) * 100) : 0,
      emailsSent,
    };
  },
});

export const _internalUpdate = internalMutation({
  args: {
    id: v.id("abandonedCarts"),
    recoveryEmailSentAt: v.optional(v.number()),
    recovered: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
