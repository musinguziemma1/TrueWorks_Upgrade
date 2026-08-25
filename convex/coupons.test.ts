/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type CouponDoc = {
  code: string;
  type: "percentage" | "fixed" | "bundle";
  value: number;
  minPurchase?: number;
  usageLimit?: number;
  expiresAt?: number;
  isActive: boolean;
  usageCount: number;
  createdAt: number;
};

function makeCoupon(overrides: Partial<CouponDoc> = {}): CouponDoc {
  return {
    code: "TEST10",
    type: "percentage",
    value: 10,
    isActive: true,
    usageCount: 0,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("coupons.validate", () => {
  test("accepts an active coupon within its usage limit", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("coupons", makeCoupon());
    });
    const result = await t.query(api.coupons.validate, { code: "TEST10" });
    expect(result.valid).toBe(true);
  });

  test("rejects an unknown code", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.coupons.validate, { code: "NOPE" });
    expect(result).toEqual({ valid: false, error: "Coupon not found" });
  });

  test("rejects an inactive coupon", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("coupons", makeCoupon({ isActive: false }));
    });
    const result = await t.query(api.coupons.validate, { code: "TEST10" });
    expect(result).toEqual({ valid: false, error: "Coupon is inactive" });
  });

  test("rejects an expired coupon", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert(
        "coupons",
        makeCoupon({ expiresAt: Date.now() - 1000 })
      );
    });
    const result = await t.query(api.coupons.validate, { code: "TEST10" });
    expect(result).toEqual({ valid: false, error: "Coupon has expired" });
  });

  test("rejects a coupon whose usage limit is exhausted", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert(
        "coupons",
        makeCoupon({ usageLimit: 5, usageCount: 5 })
      );
    });
    const result = await t.query(api.coupons.validate, { code: "TEST10" });
    expect(result).toEqual({ valid: false, error: "Coupon usage limit reached" });
  });

  test("still accepts a coupon within a raised usage limit", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert(
        "coupons",
        makeCoupon({ usageLimit: 5, usageCount: 4 })
      );
    });
    const result = await t.query(api.coupons.validate, { code: "TEST10" });
    expect(result.valid).toBe(true);
  });

  test("returns the coupon document on success so checkout can price the discount", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert(
        "coupons",
        makeCoupon({ type: "fixed", value: 25, minPurchase: 100 })
      );
    });
    const result = await t.query(api.coupons.validate, { code: "TEST10" });
    expect(result.valid).toBe(true);
    if (result.valid && result.coupon) {
      expect(result.coupon.type).toBe("fixed");
      expect(result.coupon.value).toBe(25);
      expect(result.coupon.minPurchase).toBe(100);
    }
  });
});
