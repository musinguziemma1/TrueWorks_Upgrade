import type { Metadata } from "next";
import { Suspense } from "react";
import { cache } from "react";
import { api } from "@convex/_generated/api";
import { convexServer } from "@/lib/convex-server";
import { STORE_DEFAULT_SORT, STORE_ITEMS_PER_PAGE } from "@/lib/store-constants";
import type { StoreProduct } from "@/components/product/product-card";
import StoreContent from "./content";
// Refresh the prerendered first page periodically; the client query supplies
// live data as soon as the page hydrates.
export const revalidate = 300;

/**
 * Prefetch the default first page of the store on the server.
 *
 * Without this the prerendered HTML contained the store chrome but an empty
 * product grid, so a crawler saw no product links or titles on the catalogue
 * page at all. Cached so the metadata pass and the render share one call.
 *
 * Only the unfiltered default page is prefetched — the client discards it
 * whenever a filter is active, so filtered views are unaffected.
 */
/**
 * Reduce a product to the fields `ProductCard` actually renders.
 *
 * The prefetched products are serialized into the page's flight payload, and
 * full catalog objects carry detail-page-only bulk — rich `description` HTML,
 * `faqs` transcripts, `galleryImages`, `pricingTiers`, `changelog` — which the
 * grid never touches. Stripping them keeps the crawlable, server-rendered
 * first page lean (it previously pushed the catalogue to ~4 MB of HTML).
 */
function toCardProduct(p: StoreProduct): StoreProduct {
  return {
    _id: p._id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    price: p.price,
    salePrice: p.salePrice,
    category: p.category,
    thumbnail: p.thumbnail,
    rating: p.rating,
    reviewCount: p.reviewCount,
    featured: p.featured,
    fileType: p.fileType,
    tags: p.tags,
    status: p.status,
    hasDownloadableFile: p.hasDownloadableFile,
    totalSales: p.totalSales,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    // Fields the StoreProduct type requires but the card never reads.
    description: "",
    faqs: [],
    galleryImages: [],
    industry: "",
    sku: "",
  };
}

const loadStoreFirstPage = cache(async (): Promise<StoreProduct[]> => {
  if (!convexServer) return [];
  try {
    const result = await convexServer.query(api.products.listPaginated, {
      status: "published",
      sort: STORE_DEFAULT_SORT,
      paginationOpts: { numItems: STORE_ITEMS_PER_PAGE, cursor: null },
    });
    return ((result?.page ?? []) as StoreProduct[]).map(toCardProduct);
  } catch (error) {
    console.error("Could not prefetch the store's first page", error);
    return [];
  }
});

export const metadata: Metadata = {
  title: "Store - Premium Templates & Business Systems",
  description:
    "Browse professional-grade Excel templates, financial models and dashboards for healthcare, NGOs, schools, churches and growing businesses. Instant download after purchase.",
  keywords: [
    "Excel templates",
    "business templates",
    "financial models",
    "KPI dashboards",
    "hospital templates",
    "NGO tools",
    "downloadable templates",
  ],
  openGraph: {
    title: "Store - Premium Templates & Business Systems | TrueWorks",
    description:
      "Professional-grade Excel templates, financial models and dashboards for healthcare, NGOs, schools, churches and growing businesses.",
    url: "https://trueworksgroup.com/store",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "TrueWorks Store" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Store - Premium Templates & Business Systems | TrueWorks",
    description: "Professional-grade Excel templates, financial models and dashboards.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://trueworksgroup.com/store",
  },
};

function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
          <div className="h-3 w-20 animate-pulse rounded bg-surface" />
          <div className="mt-4 h-9 w-2/3 max-w-lg animate-pulse rounded-lg bg-surface" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="h-32 animate-pulse rounded-xl border border-border bg-white" />
        <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-xl border border-border bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function StorePage() {
  const initialProducts = await loadStoreFirstPage();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://trueworksgroup.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Store",
        item: "https://trueworksgroup.com/store",
      },
    ],
  };

  return (
    <Suspense fallback={<StoreSkeleton />}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <StoreContent initialProducts={initialProducts} />
    </Suspense>
  );
}
