/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

process.env.ADMIN_EMAILS = "admin@example.com";
process.env.SUPERADMIN_EMAILS = "admin@example.com";

describe("analytics dashboard aggregates", () => {
  test("combines order and customer breakdowns while honoring the date range", async () => {
    const t = convexTest(schema, modules);
    const admin = t.withIdentity({
      tokenIdentifier: "admin|analytics-io",
      email: "admin@example.com",
    });
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert("customers", {
        email: "customer@example.com",
        name: "Customer",
        newsletterSubscribed: false,
        lifetimeValue: 100,
        totalOrders: 1,
        favoriteCategories: [],
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("orders", {
        orderNumber: "TW-ANALYTICS-RECENT",
        customerEmail: "customer@example.com",
        customerName: "Customer",
        items: [],
        subtotal: 100,
        tax: 0,
        total: 100,
        paymentMethod: "Airtel Money",
        paymentStatus: "completed",
        orderStatus: "processing",
        downloadLinks: [],
        country: "Uganda",
        region: "Central",
        city: "Kampala",
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("orders", {
        orderNumber: "TW-ANALYTICS-OLD",
        customerEmail: "customer@example.com",
        customerName: "Customer",
        items: [],
        subtotal: 50,
        tax: 0,
        total: 50,
        paymentMethod: "Card",
        paymentStatus: "refunded",
        orderStatus: "pending",
        downloadLinks: [],
        country: "Kenya",
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
    });

    const result = await admin.query(api.analytics.dashboardData, {
      startDate: new Date(now - 1_000).toISOString().slice(0, 10),
      endDate: new Date(now + 1_000).toISOString().slice(0, 10),
      startTimestamp: now - 1_000,
      endTimestamp: now + 1_000,
    });

    expect(result.summary.totalOrders).toBe(1);
    expect(result.summary.totalRevenue).toBe(100);
    expect(result.previousSummary).toBeNull();
    expect(result.breakdown.productPerformance).toEqual([]);
    expect(result.breakdown.paymentMethods).toEqual([{ name: "Airtel Money", value: 1 }]);
    expect(result.breakdown.refundedOrders).toBe(0);
    expect(result.breakdown.geoData).toEqual([
      {
        country: "Uganda",
        orders: 1,
        revenue: 100,
        regions: [{ name: "Central", count: 1 }],
        cities: [{ name: "Kampala", count: 1 }],
      },
    ]);
    expect(result.breakdown.ltvSegments.find((segment) => segment.label === "< 50K")?.count).toBe(1);
  });
});
