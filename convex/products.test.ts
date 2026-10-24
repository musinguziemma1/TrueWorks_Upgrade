/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// `requireAdmin` reads from process.env.ADMIN_EMAILS; install a known admin
// before each test so admin-gated mutations are authorized.
process.env.ADMIN_EMAILS = "admin@example.com";
process.env.SUPERADMIN_EMAILS = "admin@example.com";

type ProductSeed = {
  productType?: "template" | "book";
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

describe("products.productType", () => {
  test("keeps books and templates in separate catalog views", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("products", makeProduct({
        name: "TrueWorks Guide",
        slug: "trueworks-guide",
        sku: "TW-BOOK-001",
        productType: "book",
        fileType: "PDF",
      }));
      await ctx.db.insert("products", makeProduct({
        name: "Finance Template",
        slug: "finance-template",
        sku: "TW-TEMPLATE-001",
      }));
    });

    const books = await t.query(api.products.list, { productType: "book" });
    const templates = await t.query(api.products.list, { productType: "template" });

    expect(books.items.map((product) => product.name)).toEqual(["TrueWorks Guide"]);
    expect(templates.items.map((product) => product.name)).toEqual(["Finance Template"]);
  });
});

describe("products.bulkRemove", () => {
  test("deletes the requested products and returns the count", async () => {
    const t = convexTest(schema, modules);
    const ids: import("./_generated/dataModel").Id<"products">[] = [];
    await t.run(async (ctx) => {
      ids.push(await ctx.db.insert("products", makeProduct({ sku: "TW-A" })));
      ids.push(await ctx.db.insert("products", makeProduct({ sku: "TW-B" })));
      await ctx.db.insert("products", makeProduct({ sku: "TW-KEEP" }));
    });
    // bulkRemove is admin-gated; create a user, mark as admin, and authenticate.
    const asAdmin = t.withIdentity({ tokenIdentifier: "admin|test", email: "admin@example.com", name: "Admin" });
    const deleted = await asAdmin.mutation(api.products.bulkRemove, { ids });
    expect(deleted).toBe(2);
    const remaining = await t.run(async (ctx) => ctx.db.query("products").collect());
    expect(remaining.map((p) => p.sku)).toEqual(["TW-KEEP"]);
  });

  test("skips missing ids without throwing", async () => {
    const t = convexTest(schema, modules);
    const ids: import("./_generated/dataModel").Id<"products">[] = [];
    await t.run(async (ctx) => {
      ids.push(await ctx.db.insert("products", makeProduct({ sku: "TW-X" })));
    });
    const asAdmin = t.withIdentity({ tokenIdentifier: "admin|test", email: "admin@example.com", name: "Admin" });
    const fakeId = ids[0];
    const deleted = await asAdmin.mutation(api.products.bulkRemove, { ids: [fakeId, fakeId] });
    expect(deleted).toBe(1);
  });

  test("returns zero for stale ids without writing an audit row", async () => {
    const t = convexTest(schema, modules);
    const fakeId = await t.run(async (ctx) => ctx.db.insert("products", makeProduct({ sku: "TW-STALE" })));
    await t.run(async (ctx) => ctx.db.delete(fakeId));
    const asAdmin = t.withIdentity({ tokenIdentifier: "admin|test", email: "admin@example.com", name: "Admin" });

    const deleted = await asAdmin.mutation(api.products.bulkRemove, { ids: [fakeId] });

    expect(deleted).toBe(0);
    const auditLogs = await t.run(async (ctx) => ctx.db.query("auditLogs").collect());
    expect(auditLogs).toEqual([]);
  });
});
