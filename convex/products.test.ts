/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type ProductSeed = {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  category: string;
  industry: string;
  fileType: string;
  tags: string[];
  galleryImages: string[];
  thumbnail: string;
  faqs: { question: string; answer: string }[];
  featured: boolean;
  status: "draft" | "published" | "archived";
  totalSales: number;
  rating: number;
  reviewCount: number;
  createdAt: number;
  updatedAt: number;
};

function makeProduct(overrides: Partial<ProductSeed> = {}): ProductSeed {
  return {
    name: "Hospital Finance Kit",
    slug: "hospital-finance-kit",
    sku: "TW-HFK-001",
    shortDescription: "A complete hospital finance operating system.",
    description: "<p>Everything a hospital finance team needs.</p>",
    price: 120,
    category: "Healthcare",
    industry: "Hospitals",
    fileType: "XLSX",
    tags: ["finance", "hospital"],
    galleryImages: [],
    thumbnail: "",
    faqs: [],
    featured: false,
    status: "published",
    totalSales: 0,
    rating: 0,
    reviewCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("products.getBySlug", () => {
  test("returns a published product by exact slug", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("products", makeProduct());
    });
    const product = await t.query(api.products.getBySlug, {
      slug: "hospital-finance-kit",
    });
    expect(product).not.toBeNull();
    expect(product?.slug).toBe("hospital-finance-kit");
    expect(product?.name).toBe("Hospital Finance Kit");
  });

  test("resolves URL variants via slug normalization", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("products", makeProduct());
    });
    const product = await t.query(api.products.getBySlug, {
      slug: "Hospital Finance Kit",
    });
    expect(product?.slug).toBe("hospital-finance-kit");
  });

  test("hides draft products from unauthenticated visitors", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("products", makeProduct({ status: "draft" }));
    });
    const product = await t.query(api.products.getBySlug, {
      slug: "hospital-finance-kit",
    });
    expect(product).toBeNull();
  });

  test("hides archived products from unauthenticated visitors", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("products", makeProduct({ status: "archived" }));
    });
    const product = await t.query(api.products.getBySlug, {
      slug: "hospital-finance-kit",
    });
    expect(product).toBeNull();
  });
});
