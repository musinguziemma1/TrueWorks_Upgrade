"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { PackageSearch } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { convexClient } from "@/lib/convex";
import { ProductCard, type StoreProduct } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { StoreSidebar } from "@/components/store/store-sidebar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 9;

export default function StoreContent() {
  if (!convexClient) return null;
  return <StoreContentInner />;
}

function StoreContentInner() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(categoryParam || "All");
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
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
      setCurrentPage(1);
    }
  }

  const allProducts = useQuery(api.products.list, {
    status: "published",
  });

  const isLoading = allProducts === undefined;
  const products: StoreProduct[] = (allProducts ?? []) as StoreProduct[];

  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (industries.length > 0) {
      result = result.filter((p) => industries.includes(p.industry));
    }

    if (fileTypes.length > 0) {
      result = result.filter((p) => fileTypes.includes(p.fileType));
    }

    if (onSaleOnly) {
      result = result.filter((p) => p.salePrice && p.salePrice < p.price);
    }

    if (featuredOnly) {
      result = result.filter((p) => p.featured);
    }

    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    result = result.filter((p) => {
      const price = p.salePrice ?? p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sort) {
      case "popular":
        result.sort((a, b) => b.totalSales - a.totalSales);
        break;
      case "price-asc":
        result.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case "price-desc":
        result.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, search, activeCategory, sort, priceRange, minRating, fileTypes, onSaleOnly, featuredOnly, industries]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const reset = () => {
    setSearch("");
    setActiveCategory("All");
    setSort("newest");
    setCurrentPage(1);
    setPriceRange([0, 999999]);
    setMinRating(0);
    setFileTypes([]);
    setOnSaleOnly(false);
    setFeaturedOnly(false);
    setIndustries([]);
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
              Professional-grade Excel templates and dashboards built for African
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
                30-Day Guarantee
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <StoreSidebar
            products={products}
            search={search}
            onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
            activeCategory={activeCategory}
            onCategoryChange={(v) => { setActiveCategory(v); setCurrentPage(1); }}
            sort={sort}
            onSortChange={(v) => { setSort(v); setCurrentPage(1); }}
            priceRange={priceRange}
            onPriceRangeChange={(v) => { setPriceRange(v); setCurrentPage(1); }}
            minRating={minRating}
            onMinRatingChange={(v) => { setMinRating(v); setCurrentPage(1); }}
            fileTypes={fileTypes}
            onFileTypesChange={(v) => { setFileTypes(v); setCurrentPage(1); }}
            onSaleOnly={onSaleOnly}
            onOnSaleOnlyChange={(v) => { setOnSaleOnly(v); setCurrentPage(1); }}
            featuredOnly={featuredOnly}
            onFeaturedOnlyChange={(v) => { setFeaturedOnly(v); setCurrentPage(1); }}
            industries={industries}
            onIndustriesChange={(v) => { setIndustries(v); setCurrentPage(1); }}
            onReset={reset}
            resultCount={filtered.length}
            totalCount={products.length}
          />

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading templates...
                  </span>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-foreground">{paginated.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                    template{filtered.length === 1 ? "" : "s"}
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
            ) : paginated.length > 0 ? (
              <motion.div
                key={activeCategory + search + sort + currentPage + JSON.stringify(priceRange) + minRating + fileTypes.join() + onSaleOnly + featuredOnly + industries.join()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3"
              >
                {paginated.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
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

            {totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={cn(currentPage >= totalPages && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
