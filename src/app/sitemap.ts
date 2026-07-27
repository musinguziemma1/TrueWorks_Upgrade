import type { MetadataRoute } from "next";
import { api } from "@convex/_generated/api";
import { convexServer } from "@/lib/convex-server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksug.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/store",
    "/about",
    "/resources",
    "/contact",
    "/faq",
    "/privacy",
    "/terms",
    "/refund-policy",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/store" ? 0.9 : 0.6,
  }));

  if (!convexServer) return staticRoutes;

  try {
    const [products, resources] = await Promise.all([
      convexServer.query(api.products.list, { status: "published" }),
      convexServer.query(api.resources.listPublished, {}),
    ]);

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${SITE_URL}/store/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const resourceRoutes: MetadataRoute.Sitemap = (resources ?? []).map((r) => ({
      url: `${SITE_URL}/resources/${r.slug}`,
      lastModified: new Date(r.updatedAt),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    return [...staticRoutes, ...productRoutes, ...resourceRoutes];
  } catch {
    return staticRoutes;
  }
}
