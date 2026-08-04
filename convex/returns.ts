import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin, requireAdminSilent } from "./users";
import { auditLog } from "./lib/audit";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("returns")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", user.clerkId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    orderId: v.id("orders"),
    items: v.array(v.object({
      productName: v.string(),
      quantity: v.number(),
      price: v.number(),
      reason: v.string(),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not found");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.customerEmail !== user.email) throw new Error("Not your order");
    if (order.paymentStatus !== "completed") throw new Error("Order is not completed");

    const existing = await ctx.db
      .query("returns")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();
    if (existing.length > 0) {
      throw new Error("A return request already exists for this order");
    }

    const now = Date.now();
    return await ctx.db.insert("returns", {
      clerkId: user.clerkId,
      orderId: args.orderId,
      orderNumber: order.orderNumber,
      customerEmail: user.email,
      customerName: user.name ?? user.email,
      items: args.items,
      status: "pending",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const adminList = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await requireAdminSilent(ctx))) return [];
    const base = ctx.db.query("returns");
    const q = args.status
      ? base.withIndex("by_status", (idx) =>
          idx.eq("status", args.status as "pending" | "approved" | "rejected" | "completed")
        )
      : base;
    return await q.order("desc").collect();
  },
});

export const adminUpdateStatus = mutation({
  args: {
    id: v.id("returns"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const ret = await ctx.db.get(args.id);
    if (!ret) throw new Error("Return not found");
    await ctx.db.patch(args.id, {
      status: args.status,
      adminNotes: args.adminNotes,
      updatedAt: Date.now(),
    });
    await auditLog(ctx, {
      action: "return.status_update",
      entityType: "return",
      entityId: args.id,
      summary: `Updated return "${ret.orderNumber}" to ${args.status}`,
      changes: { from: ret.status, to: args.status, adminNotes: args.adminNotes },
    });
  },
});
