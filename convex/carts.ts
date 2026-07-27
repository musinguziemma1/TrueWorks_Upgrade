import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

const cartItem = v.object({
  id: v.string(),
  name: v.string(),
  price: v.number(),
  quantity: v.number(),
  image: v.string(),
  slug: v.string(),
});

const wishlistItem = v.object({
  id: v.string(),
  name: v.string(),
  slug: v.string(),
  price: v.number(),
  image: v.string(),
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me?.clerkId) return null;
    return await ctx.db
      .query("carts")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", me.clerkId!))
      .first();
  },
});

export const saveMine = mutation({
  args: {
    items: v.array(cartItem),
    wishlist: v.array(wishlistItem),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me?.clerkId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("carts")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", me.clerkId!))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        items: args.items,
        wishlist: args.wishlist,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("carts", {
      clerkId: me.clerkId,
      items: args.items,
      wishlist: args.wishlist,
      updatedAt: Date.now(),
    });
  },
});
