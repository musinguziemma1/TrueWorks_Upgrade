import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { api } from "@convex/_generated/api";
import { convexServer } from "@/lib/convex-server";
import ProductDetail from "./content";

// Product detail pages are served from cache for 5 minutes to keep cold
// requests fast; a product edit can nudge revalidation via on-demand revalidate.
export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";

type Props = { params: Promise<{ slug: string }> };

/**
 * Server-side load for the detail page.
 *
 * The three states are deliberately distinct:
 *   - found       → render the real product into the HTML
 *   - missing     → a genuine 404 (unknown slug, or unpublished to the public)
 *   - unavailable → Convex could not be reached; render the shell and let the
 *                   client query recover, so an outage can never delist the
 *                   catalogue by mass-404ing it.
 *
 * `getBySlug` already hides non-published products from anonymous callers,
 * which is what this reads as.
 */
const loadProduct = cache(async (slug: string) => {
  if (!convexServer) return { status: "unavailable" as const };
  try {
    const product = await convexServer.query(api.products.getBySlug, { slug });
    return product
      ? { status: "found" as const, product }
      : { status: "missing" as const };
  } catch (error) {
    console.error(`Could not load product "${slug}" for server render`, error);
    return { status: "unavailable" as const };
  }
});

/**
 * Prerender every published product at build time so the first crawl request
 * already receives full HTML instead of an empty shell.
 */
export async function generateStaticParams() {
  if (!convexServer) return [];
  try {
    const result = await convexServer.query(api.products.list, {
      status: "published",
      limit: 1000,
    });
    return (result?.items ?? []).map((product) => ({ slug: product.slug }));
  } catch (error) {
    console.error("Could not list published products for prerendering", error);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadProduct(slug);

  // Never noindex on an outage — only on a genuine miss.
  if (result.status === "missing") {
    return { title: "Product Not Found", robots: { index: false, follow: true } };
  }
  if (result.status !== "found") return { title: "Product" };

  const product = result.product;
  const price = product.salePrice ?? product.price;

  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `${SITE_URL}/store/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      type: "website",
      url: `${SITE_URL}/store/${product.slug}`,
      images: product.thumbnail
        ? [{ url: product.thumbnail, width: 800, height: 600, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription,
    },
    other: price ? { "product:price:amount": String(price) } : undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const result = await loadProduct(slug);

  // A real 404 rather than a 200 shell Google would file as a soft 404.
  if (result.status === "missing") notFound();

  // Only passed when the server actually resolved a product; otherwise the
  // client query owns the loading/not-found states as before.
  const product = result.status === "found" ? result.product : undefined;

  const jsonLd = product
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.shortDescription,
          image: product.thumbnail ? [product.thumbnail] : undefined,
          category: product.category,
          brand: { "@type": "Brand", name: "TrueWorks" },
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/store/${product.slug}`,
            price: product.salePrice ?? product.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
          ...(product.reviewCount > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.rating,
                  reviewCount: product.reviewCount,
                },
              }
            : {}),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Store",
              item: `${SITE_URL}/store`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: product.name,
              item: `${SITE_URL}/store/${product.slug}`,
            },
          ],
        },
      ]
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: Array.isArray(jsonLd)
              ? jsonLd.map((j) => JSON.stringify(j)).join("\n")
              : JSON.stringify(jsonLd),
          }}
        />
      )}
      <ProductDetail initialProduct={product} />
    </>
  );
}
