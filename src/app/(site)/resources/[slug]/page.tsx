import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { api } from "@convex/_generated/api";
import { convexServer } from "@/lib/convex-server";
import ResourceLoader from "./loader";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";

type Props = { params: Promise<{ slug: string }> };

/**
 * Server-side load for the resource page.
 *
 *   - found       → the article body is rendered into the HTML
 *   - missing     → a genuine 404 (unknown slug, or unpublished to the public)
 *   - unavailable → Convex unreachable; fall back to the client-side loader so a
 *                   transient outage never mass-404s the resource library.
 *
 * `resources.getBySlug` already hides non-published resources from anonymous
 * callers, which is what this reads as.
 */
const loadResource = cache(async (slug: string) => {
  if (!convexServer) return { status: "unavailable" as const };
  try {
    const resource = await convexServer.query(api.resources.getBySlug, { slug });
    return resource
      ? { status: "found" as const, resource }
      : { status: "missing" as const };
  } catch (error) {
    console.error(`Could not load resource "${slug}" for server render`, error);
    return { status: "unavailable" as const };
  }
});

/** Prerender every published resource so crawlers never hit an empty shell. */
export async function generateStaticParams() {
  if (!convexServer) return [];
  try {
    const resources = await convexServer.query(api.resources.listPublished, {});
    return (resources ?? []).map((resource) => ({ slug: resource.slug }));
  } catch (error) {
    console.error("Could not list published resources for prerendering", error);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadResource(slug);

  // Never noindex on an outage — only on a genuine miss.
  if (result.status === "missing") {
    return { title: "Resource Not Found", robots: { index: false, follow: true } };
  }
  if (result.status !== "found") return { title: "Resource" };

  const resource = result.resource;
  return {
    title: resource.title,
    description: resource.description,
    alternates: { canonical: `${SITE_URL}/resources/${resource.slug}` },
    openGraph: {
      title: resource.title,
      description: resource.description,
      type: "article",
      url: `${SITE_URL}/resources/${resource.slug}`,
      images: resource.featuredImage ? [{ url: resource.featuredImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: resource.title,
      description: resource.description,
      images: resource.featuredImage ? [resource.featuredImage] : undefined,
    },
  };
}

export default async function ResourceDetailPage({ params }: Props) {
  const { slug } = await params;
  const result = await loadResource(slug);

  // A real 404 rather than a 200 shell Google would file as a soft 404.
  if (result.status === "missing") notFound();

  return (
    <ResourceLoader
      initialResource={result.status === "found" ? result.resource : undefined}
    />
  );
}
