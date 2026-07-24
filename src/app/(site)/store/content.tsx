"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { ProductCard, type StoreProduct } from "@/components/product/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const productCategories = [
  "Healthcare",
  "Business",
  "Finance",
  "NGO",
  "HR",
  "Schools",
  "Churches",
  "Agriculture",
];

const categories = ["All", ...productCategories];

const sortOptions = [
  { value: "newest", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const ITEMS_PER_PAGE = 9;

export default function StoreContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(() =>
    categoryParam && categories.includes(categoryParam as (typeof categories)[number])
      ? categoryParam
      : "All"
  );
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [lastCategoryParam, setLastCategoryParam] = useState(categoryParam);
  if (categoryParam !== lastCategoryParam) {
    setLastCategoryParam(categoryParam);
    if (categoryParam && categories.includes(categoryParam as (typeof categories)[number])) {
      setActiveCategory(categoryParam);
      setCurrentPage(1);
    }
  }

  const allProducts = useQuery(api.products.list, {
    status: "published",
    category: activeCategory !== "All" ? activeCategory : undefined,
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
          p.shortDescription.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== "All") result = result.filter((p) => p.category === activeCategory);
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
      default:
        result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  }, [products, search, activeCategory, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const reset = () => {
    setSearch("");
    setActiveCategory("All");
    setSort("newest");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            The Store
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-primary md:text-4xl lg:text-[2.75rem]">
            Premium Templates &amp; Business Systems
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Professional-grade Excel templates and dashboards built for African
            organizations. Pay securely, download instantly, and put them to work
            the same day.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                placeholder="Search templates, categories..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 border-border bg-surface pl-10 focus:bg-white"
                aria-label="Search templates"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <Select
                value={sort}
                onValueChange={(v) => {
                  if (v) {
                    setSort(v);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="h-11 w-full border-border bg-surface sm:w-52" aria-label="Sort products">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentPage(1);
                }}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  activeCategory === cat
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border bg-white text-muted hover:border-primary/40 hover:text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-muted">
            {isLoading ? (
              "Loading templates..."
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-foreground">{paginated.length}</span> of{" "}
                <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                template{filtered.length === 1 ? "" : "s"}
                {activeCategory !== "All" && (
                  <>
                    {" "}in <span className="font-semibold text-primary">{activeCategory}</span>
                  </>
                )}
              </>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-xl border border-border bg-white" />
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <motion.div
            key={activeCategory + search + sort + currentPage}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3"
          >
            {paginated.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-24 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
              <PackageSearch className="h-7 w-7 text-muted" />
            </span>
            <p className="mt-5 font-heading text-xl font-semibold text-primary">
              No templates found
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Try a different search term or browse another category.
            </p>
            <Button onClick={reset} className="mt-6">
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
                  <PaginationLink isActive={page === currentPage} onClick={() => setCurrentPage(page)}>
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
  );
}
