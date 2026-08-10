"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PackageSearch, Loader2 } from "lucide-react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { ProductCard, type StoreProduct } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { StoreSidebar, type StoreFacets } from "@/components/store/store-sidebar";

const ITEMS_PER_PAGE = 9;

export default function StoreContent() {
  if (!convexClient) return null;
  return <StoreContentInner />;
}

function StoreContentInner() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const qParam = searchParams.get("q");

  const [search, setSearch] = useState(qParam || "");
  const [activeCategory, setActiveCategory] = useState(categoryParam || "All");
  const [sort, setSort] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999]);
  const [minRating, setMinRating] = useState(0);
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);

  const [lastCategoryParam, setLastCategoryParam] = useState(categoryParam);
  if (categoryParam !== lastCategoryParam) {
    setLastCategoryParam(categoryParam);
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }

  const [lastQParam, setLastQParam] = useState(qParam);
  if (qParam !== lastQParam) {
    setLastQParam(qParam);
    if (qParam) {
      setSearch(qParam);
    }
  }

  // All filtering happens in Convex — args must be present (even defaults)
  // so that changing a filter invalidates the pagination cursor.
  const { results, status, loadMore } = usePaginatedQuery(
    api.products.listPaginated,
    {
      search: search.trim() || undefined,
      category: activeCategory !== "All" ? activeCategory : undefined,
      industries: industries.length > 0 ? industries : undefined,
      fileTypes: fileTypes.length > 0 ? fileTypes : undefined,
      onSale: onSaleOnly || undefined,
      featured: featuredOnly || undefined,
      minRating: minRating > 0 ? minRating : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 999999 ? priceRange[1] : undefined,
      sort,
      status: "published",
    },
    { initialNumItems: ITEMS_PER_PAGE }
  );

  const facets = useQuery(api.products.getStoreFacets);
  const dbCategories = useQuery(api.categories.list, {});
  const categoryNames = (dbCategories ?? []).map((c) => c.name);

  const products: StoreProduct[] = (results ?? []) as StoreProduct[];
  const isLoading = status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";

  const reset = () => {
    setSearch("");
    setActiveCategory("All");
    setSort("newest");
    setPriceRange([0, 999999]);
    setMinRating(0);
    setFileTypes([]);
    setOnSaleOnly(false);
    setFeaturedOnly(false);
    setIndustries([]);
  };

  const pageFacets: StoreFacets = {
    categoryCounts: facets?.categoryCounts ?? {},
    industryCounts: facets?.industryCounts ?? {},
    fileTypeCounts: facets?.fileTypeCounts ?? {},
    saleCount: facets?.saleCount ?? 0,
    featuredCount: facets?.featuredCount ?? 0,
    minPrice: facets?.minPrice ?? 0,
    maxPrice: facets?.maxPrice ?? 0,
    total: facets?.total ?? 0,
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary via-primary-dark to-secondary">
        {/* Decorative elements */}
        <div className="absolute inset-0 texture-dots opacity-30" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent backdrop-blur-sm border border-white/10 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              The Store
            </div>
            <h1 className="font-heading text-3xl font-bold text-white md:text-4xl lg:text-5xl leading-tight">
              Premium Templates &amp;<br />
              <span className="text-gradient-gold">Business Systems</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 lg:text-lg">
              Professional-grade Excel templates and dashboards built for Global
              organizations. Pay securely, download instantly, and put them to work
              the same day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px]">
                  ✓
                </span>
                Instant Download
              </span>
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px]">
                  ✓
                </span>
                Secure Payment
              </span>
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px]">
                  ✓
                </span>
                4-day Guarantee
              </span>
            </div>
          </div>

            {/* Animated dashboard visual */}
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-white/50">Portfolio Performance</p>
                    <p className="text-2xl font-bold text-white">$48,392.00</p>
                  </div>
                  <span className="rounded-full bg-green-500/20 text-green-300 text-xs px-3 py-1">+12.4%</span>
                </div>
                <div className="flex items-end gap-3 h-28">
                  {[35, 55, 40, 65, 50, 75, 60, 85, 70, 95, 80, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-accent/60 to-accent/20" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <StoreSidebar
            categories={categoryNames}
            search={search}
            onSearchChange={setSearch}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            sort={sort}
            onSortChange={setSort}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            minRating={minRating}
            onMinRatingChange={setMinRating}
            fileTypes={fileTypes}
            onFileTypesChange={setFileTypes}
            onSaleOnly={onSaleOnly}
            onOnSaleOnlyChange={setOnSaleOnly}
            featuredOnly={featuredOnly}
            onFeaturedOnlyChange={setFeaturedOnly}
            industries={industries}
            onIndustriesChange={setIndustries}
            onReset={reset}
            resultCount={products.length}
            facets={pageFacets}
          />

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Loading templates...
                  </span>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-foreground">{products.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{pageFacets.total}</span>{" "}
                    template{pageFacets.total === 1 ? "" : "s"}
                  </>
                )}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-border bg-white">
                    <div className="h-48 animate-pulse bg-gradient-to-br from-surface to-border/30" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 w-3/4 animate-pulse rounded-lg bg-surface" />
                      <div className="h-4 w-full animate-pulse rounded bg-surface" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
                      <div className="flex gap-2 pt-2">
                        <div className="h-3 w-12 animate-pulse rounded bg-surface" />
                        <div className="h-3 w-16 animate-pulse rounded bg-surface" />
                      </div>
                      <div className="pt-3 border-t border-border/50">
                        <div className="h-6 w-24 animate-pulse rounded bg-surface" />
                      </div>
                      <div className="h-11 w-full animate-pulse rounded-xl bg-surface" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <motion.div
                key={activeCategory + search + sort + JSON.stringify(priceRange) + minRating + fileTypes.join() + onSaleOnly + featuredOnly + industries.join()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3"
              >
                {products.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: (i % ITEMS_PER_PAGE) * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-28 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface">
                  <PackageSearch className="h-9 w-9 text-muted/60" />
                </span>
                <p className="mt-6 font-heading text-xl font-semibold text-primary">
                  No templates found
                </p>
                <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
                  We couldn&apos;t find any templates matching your filters.
                  Try adjusting your search or browse a different category.
                </p>
                <Button onClick={reset} className="mt-8 rounded-xl px-6">
                  Clear all filters
                </Button>
              </div>
            )}

            {canLoadMore && (
              <div className="mt-12 flex justify-center">
                <Button
                  variant="outline"
                  className="rounded-xl px-8"
                  onClick={() => loadMore(ITEMS_PER_PAGE)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PackageSearch className="mr-2 h-4 w-4" />
                  )}
                  Load more
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}