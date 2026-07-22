import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];
    const items = await ctx.db
      .query("downloads")
      .withIndex("by_email", (q) => q.eq("email", me.email))
      .order("desc")
      .take(50);
    return await Promise.all(
      items.map(async (d) => {
        const product = await ctx.db.get(d.productId);
        return {
          ...d,
          productName: product?.name ?? "Unknown product",
          productSlug: product?.slug ?? "",
        };
      })
    );
  },
});
