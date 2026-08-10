import {
  query,
  mutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getCurrentUser, requireAdmin, requireAdminSilent } from "./users";
import { auditLog } from "./lib/audit";

/**
 * Refund policy. Customers may request a refund only within this window after
 * purchase; admin approval is required to actually complete a refund. Mirrors
 * the window shown on the storefront (src/lib/refund-policy.ts).
 */
export const REFUND_WINDOW_DAYS = 4;
export const REFUND_WINDOW_MS = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export const getRefundPolicy = query({
  args: {},
  handler: async () => ({ windowDays: REFUND_WINDOW_DAYS, windowMs: REFUND_WINDOW_MS }),
});

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

    const orderedAt = order.createdAt ?? order._creationTime;
    if (Date.now() - orderedAt > REFUND_WINDOW_MS) {
      throw new Error(
        `Refunds are only allowed within ${REFUND_WINDOW_DAYS} days of purchase. This order is no longer eligible.`
      );
    }

    const existing = await ctx.db
      .query("returns")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();
    if (existing.length > 0) {
      throw new Error("A return request already exists for this order");
    }

    const now = Date.now();
    const id = await ctx.db.insert("returns", {
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

    await ctx.runMutation(internal.notifications.createPublic, {
      type: "refund",
      title: "New Refund Request",
      message: `${user.name ?? user.email} requested a refund for order ${order.orderNumber}`,
      link: "/admin/returns",
    });

    return id;
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
    const rows = await q.order("desc").collect();
    return await Promise.all(
      rows.map(async (r) => {
        const order = await ctx.db.get(r.orderId);
        const orderedAt = order?.createdAt ?? r._creationTime;
        return {
          ...r,
          orderCreatedAt: orderedAt,
          refundDeadline: orderedAt + REFUND_WINDOW_MS,
          windowExpired: Date.now() > orderedAt + REFUND_WINDOW_MS,
        };
      })
    );
  },
});

/**
 * Admin reviews a refund request. Approving schedules the actual refund
 * (provider reversal + revocation + stats rollback). Both approve and reject
 * are restricted to the 4-day window after purchase.
 */
export const review = mutation({
  args: {
    id: v.id("returns"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const ret = await ctx.db.get(args.id);
    if (!ret) throw new Error("Return request not found");
    if (ret.status !== "pending") throw new Error("This request has already been reviewed");

    const order = await ctx.db.get(ret.orderId);
    if (!order) throw new Error("Order not found");

    const identity = await ctx.auth.getUserIdentity();
    const adminName = identity?.name ?? identity?.email ?? "Admin";

    if (args.decision === "approve") {
      const orderedAt = order.createdAt ?? order._creationTime;
      if (Date.now() - orderedAt > REFUND_WINDOW_MS) {
        throw new Error(`Refund window (${REFUND_WINDOW_DAYS} days after purchase) has expired`);
      }

      if (order.paymentStatus === "refunded") {
        // Already reversed (e.g. provider auto-refund). Just close the request.
        await ctx.db.patch(args.id, {
          status: "completed",
          adminNotes: args.adminNotes,
          refundedAt: Date.now(),
          providerResult: "already_refunded",
          updatedAt: Date.now(),
        });
        await auditLog(ctx, {
          action: "return.approve",
          entityType: "return",
          entityId: args.id,
          summary: `Approved return "${ret.orderNumber}" (already refunded) by ${adminName}`,
        });
        return;
      }

      await ctx.db.patch(args.id, {
        status: "approved",
        adminNotes: args.adminNotes,
        approvedAt: Date.now(),
        updatedAt: Date.now(),
      });
      await auditLog(ctx, {
        action: "return.approve",
        entityType: "return",
        entityId: args.id,
        summary: `Approved return "${ret.orderNumber}" by ${adminName}`,
        changes: { adminNotes: args.adminNotes },
      });
      await ctx.scheduler.runAfter(0, internal.refunds.executeRefund, {
        returnId: args.id,
        adminName,
      });
      await ctx.runMutation(internal.notifications.createPublic, {
        type: "refund",
        title: "Refund Approved",
        message: `Refund for order ${ret.orderNumber} was approved and is being processed.`,
        link: "/admin/returns",
      });
    } else {
      await ctx.db.patch(args.id, {
        status: "rejected",
        adminNotes: args.adminNotes,
        updatedAt: Date.now(),
      });
      await auditLog(ctx, {
        action: "return.reject",
        entityType: "return",
        entityId: args.id,
        summary: `Rejected return "${ret.orderNumber}" by ${adminName}`,
        changes: { adminNotes: args.adminNotes },
      });
      await ctx.runMutation(internal.notifications.createPublic, {
        type: "refund",
        title: "Refund Rejected",
        message: `Refund request for order ${ret.orderNumber} was rejected.`,
        link: "/admin/returns",
      });
      await ctx.scheduler.runAfter(0, internal.email.sendRefundEmail, {
        to: order.customerEmail,
        customerName: order.customerName || "Customer",
        orderNumber: order.orderNumber,
        amount: order.total,
        reason: ret.items[0]?.reason,
        type: "rejected",
      });
    }
  },
});

