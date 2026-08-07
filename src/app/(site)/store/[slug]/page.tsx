import type { Metadata } from "next";
import { api } from "@convex/_generated/api";
import { convexServer } from "@/lib/convex-server";
import ProductDetail from "./content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trueworksgroup.com";

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  if (!convexServer) return null;
  try {
    return await convexServer.query(api.products.getBySlug, { slug });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

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
  const product = await getProduct(slug);

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
      <ProductDetail />
    </>
  );
}
