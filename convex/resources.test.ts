/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// requireEditor/requireAdmin read from env; install a known admin/editor so
// mutations pass the auth gate in tests.
process.env.ADMIN_EMAILS = "admin@example.com";
process.env.SUPERADMIN_EMAILS = "admin@example.com";

function makeResource(overrides: Partial<{
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  type: "document" | "video" | "link" | "download";
  status: "draft" | "published" | "archived";
  featured: boolean;
  featuredImage?: string;
  attachments?: { name: string; url: string; size: number }[];
  externalUrl?: string;
  thumbnail?: string;
  tags: string[];
  downloadCount: number;
  createdAt: number;
  updatedAt: number;
}> = {}) {
  return {
    title: "Getting Started Guide",
    slug: "getting-started",
    description: "A quick introduction to the platform.",
    content: "Long form content here.",
    category: "Guide",
    type: "document" as const,
    status: "published" as const,
    featured: false,
    attachments: [],
    tags: ["intro"],
    downloadCount: 12,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

const asEditor = (t: ReturnType<typeof convexTest>) =>
  t.withIdentity({ tokenIdentifier: "editor|test", email: "admin@example.com", name: "Admin" });

describe("resources.duplicate", () => {
  test("creates a draft copy with `-copy` slug and reset download count", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await t.run(async (ctx) =>
      ctx.db.insert("resources", makeResource({ slug: "guide", downloadCount: 42, status: "published" }))
    );

    const newId = await asEditor(t).mutation(api.resources.duplicate, { id: sourceId });
    expect(newId).not.toBe(sourceId);

    const copy = await t.run(async (ctx) => ctx.db.get(newId));
    expect(copy).not.toBeNull();
    expect(copy?.title).toBe("Getting Started Guide (Copy)");
    expect(copy?.slug).toBe("guide-copy");
    expect(copy?.status).toBe("draft");
    expect(copy?.downloadCount).toBe(0);
  });

  test("appends a numeric suffix when a copy already exists", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await t.run(async (ctx) =>
      ctx.db.insert("resources", makeResource({ slug: "handbook" }))
    );
    await t.run(async (ctx) => ctx.db.insert("resources", makeResource({ slug: "handbook-copy" })));

    const newId = await asEditor(t).mutation(api.resources.duplicate, { id: sourceId });
    const copy = await t.run(async (ctx) => ctx.db.get(newId));
    expect(copy?.slug).toBe("handbook-copy-2");
  });

  test("rejects unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await t.run(async (ctx) => ctx.db.insert("resources", makeResource()));
    await expect(t.mutation(api.resources.duplicate, { id: sourceId })).rejects.toThrow();
  });
});
