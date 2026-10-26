/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

process.env.ADMIN_EMAILS = "admin@example.com";
process.env.SUPERADMIN_EMAILS = "admin@example.com";

describe("orders.list bounded status queries", () => {
  test("uses the requested status, date window, and result limit", async () => {
    const t = convexTest(schema, modules);
    const admin = t.withIdentity({
      tokenIdentifier: "admin|orders-io",
      email: "admin@example.com",
    });
    const now = Date.now();

    await t.run(async (ctx) => {
      const insertOrder = async (orderNumber: string, paymentStatus: "pending" | "completed", createdAt: number) =>
        ctx.db.insert("orders", {
          orderNumber,
          customerEmail: "customer@example.com",
          customerName: "Customer",
          items: [],
          subtotal: 10,
          tax: 0,
          total: 10,
          paymentMethod: "Card",
          paymentStatus,
          orderStatus: "pending",
          downloadLinks: [],
          createdAt,
          updatedAt: createdAt,
        });

      await insertOrder("TW-OLD", "pending", now - 10_000);
      await insertOrder("TW-PENDING-1", "pending", now - 200);
      await insertOrder("TW-PENDING-2", "pending", now - 100);
      await insertOrder("TW-COMPLETED", "completed", now - 50);
    });

    const result = await admin.query(api.orders.list, {
      paymentStatus: "pending",
      startDate: now - 500,
      endDate: now,
      limit: 1,
    });

    expect(result.map((order) => order.orderNumber)).toEqual(["TW-PENDING-2"]);
  });
});
