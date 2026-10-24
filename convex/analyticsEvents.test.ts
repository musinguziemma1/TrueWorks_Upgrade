/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

process.env.ADMIN_EMAILS = "admin@example.com";
process.env.SUPERADMIN_EMAILS = "admin@example.com";

describe("analytics event durability", () => {
  test("replaying a client event does not create a second row", async () => {
    const t = convexTest(schema, modules);

    const first = await t.mutation(api.analyticsEvents.track, {
      eventId: "event-replay-1",
      event: "view_product",
      sessionId: "session-1",
      path: "/store/example",
    });
    const second = await t.mutation(api.analyticsEvents.track, {
      eventId: "event-replay-1",
      event: "view_product",
      sessionId: "session-1",
      path: "/store/example",
    });

    expect(first).toEqual({ accepted: true, duplicate: false });
    expect(second).toEqual({ accepted: true, duplicate: true });

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("analyticsEvents")
        .withIndex("by_eventId", (q) => q.eq("eventId", "event-replay-1"))
        .collect()
    );
    expect(rows).toHaveLength(1);
  });

  test("purchase events are idempotent when recorded by payment settlement", async () => {
    const t = convexTest(schema, modules);
    const orderId = await t.run(async (ctx) =>
      ctx.db.insert("orders", {
        orderNumber: "TW-ANALYTICS-001",
        customerEmail: "buyer@example.com",
        customerName: "Test Buyer",
        items: [],
        subtotal: 100,
        tax: 0,
        total: 100,
        paymentMethod: "stripe",
        paymentStatus: "completed",
        orderStatus: "completed",
        downloadLinks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );

    const first = await t.mutation(internal.analyticsEvents.recordPurchase, {
      orderId,
      items: [],
    });
    const second = await t.mutation(internal.analyticsEvents.recordPurchase, {
      orderId,
      items: [],
    });

    expect(first).toEqual({ accepted: true, duplicate: false });
    expect(second).toEqual({ accepted: true, duplicate: true });

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("analyticsEvents")
        .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
        .collect()
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.event).toBe("purchase");
  });

  test("only counts chronological funnel progression", async () => {
    const t = convexTest(schema, modules);
    const admin = t.withIdentity({ tokenIdentifier: "admin|analytics", email: "admin@example.com" });

    await t.mutation(api.analyticsEvents.track, {
      eventId: "funnel-view",
      event: "view_product",
      sessionId: "funnel-session",
    });
    await t.mutation(api.analyticsEvents.track, {
      eventId: "funnel-payment-too-early",
      event: "payment_start",
      sessionId: "funnel-session",
    });
    await t.mutation(api.analyticsEvents.track, {
      eventId: "funnel-cart",
      event: "add_to_cart",
      sessionId: "funnel-session",
    });

    const beforeCheckout = await admin.query(api.analyticsEvents.funnel, {});
    expect(beforeCheckout.funnel.map((step) => step.count)).toEqual([1, 1, 0, 0, 0]);

    await t.mutation(api.analyticsEvents.track, {
      eventId: "funnel-checkout",
      event: "reach_checkout",
      sessionId: "funnel-session",
    });
    await t.mutation(api.analyticsEvents.track, {
      eventId: "funnel-payment",
      event: "payment_start",
      sessionId: "funnel-session",
    });

    const afterCheckout = await admin.query(api.analyticsEvents.funnel, {});
    expect(afterCheckout.funnel.map((step) => step.count)).toEqual([1, 1, 1, 1, 0]);

    const overview = await admin.query(api.analyticsEvents.overview, {});
    expect(overview).toEqual({
      total: 4,
      byEvent: {
        view_product: 1,
        add_to_cart: 1,
        reach_checkout: 1,
        payment_start: 1,
        purchase: 0,
      },
      topProducts: [],
    });
  });
});
