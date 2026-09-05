"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, PackageSearch, Loader2 } from "lucide-react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
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
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="gradient-brand relative overflow-hidden">
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent/[0.10] blur-3xl" aria-hidden />
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-accent/[0.06] blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-light backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                The Store
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
                className="mt-5 font-heading text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl"
              >
                Premium templates &amp;{" "}
                <span className="text-gradient-gold">business systems</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}
                className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
              >
                Professional-grade Excel templates and dashboards for Global
                organizations. Pay securely, download instantly, and put them to
                work the same day.
              </motion.p>
              <motion.ul
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
                className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70"
              >
                {[
                  "Instant download",
                  "Secure checkout",
                  "30-day guarantee",
                  "Free updates",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent-light" />
                    {t}
                  </li>
                ))}
              </motion.ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="lg:col-span-5"
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  { v: pageFacets.total.toLocaleString(), l: "Templates" },
                  { v: categoryNames.length.toString(), l: "Categories" },
                  { v: Object.values(pageFacets.industryCounts).reduce((s, n) => s + n, 0).toLocaleString(), l: "Industry picks" },
                ].map((m, i) => (
                  <div
                    key={m.l}
                    className={cn(
                      "rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur",
                      i === 0 && "sm:col-span-3 lg:col-span-1 xl:col-span-1"
                    )}
                  >
                    <p className="font-heading text-3xl font-semibold text-white tabular-nums">
                      {isLoading && m.l === "Templates" ? "—" : m.v}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
                      {m.l}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-card">
              <p className="text-sm text-muted-foreground">
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
              <span className="text-xs text-muted-foreground">
                Updated weekly
              </span>
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
                style={{ minHeight: "600px" }}
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
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-24 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
                  <PackageSearch className="h-8 w-8 text-muted-foreground" />
                </span>
                <p className="mt-6 font-heading text-xl font-semibold text-primary">
                  No templates found
                </p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
                  We couldn&apos;t find any templates matching your filters.
                  Try adjusting your search or browse a different category.
                </p>
                <Button onClick={reset} className="mt-7 gradient-gold text-primary-dark">
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