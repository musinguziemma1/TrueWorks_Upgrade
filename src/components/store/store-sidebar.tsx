"use client"

import { useState, useMemo } from "react"
import {
  Search,
  SlidersHorizontal,
  Star,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Percent,
  RotateCcw,
  FolderOpen,
  Building2,
  DollarSign,
  BarChart3,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { StoreProduct } from "@/components/product/product-card"

interface StoreSidebarProps {
  products: StoreProduct[]
  search: string
  onSearchChange: (v: string) => void
  activeCategory: string
  onCategoryChange: (v: string) => void
  sort: string
  onSortChange: (v: string) => void
  priceRange: [number, number]
  onPriceRangeChange: (v: [number, number]) => void
  minRating: number
  onMinRatingChange: (v: number) => void
  fileTypes: string[]
  onFileTypesChange: (v: string[]) => void
  onSaleOnly: boolean
  onOnSaleOnlyChange: (v: boolean) => void
  featuredOnly: boolean
  onFeaturedOnlyChange: (v: boolean) => void
  industries: string[]
  onIndustriesChange: (v: string[]) => void
  onReset: () => void
  resultCount: number
  totalCount: number
}

const allCategories = [
  "All",
  "Hospital & Healthcare",
  "Finance & Accounting",
  "NGO & Grants",
  "Education & E-Learning",
  "Project Management",
  "Sales & CRM",
]

const allIndustries = [
  "Healthcare",
  "Finance",
  "Nonprofit",
  "Education",
  "Operations",
  "Sales",
]

const allFileTypes = [
  "Excel / Google Sheets",
  "PDF",
  "Word",
  "PowerPoint",
]

const sortOptions = [
  { value: "newest", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
]

function FilterSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

export function StoreSidebar({
  products,
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  sort,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  minRating,
  onMinRatingChange,
  fileTypes,
  onFileTypesChange,
  onSaleOnly,
  onOnSaleOnlyChange,
  featuredOnly,
  onFeaturedOnlyChange,
  industries,
  onIndustriesChange,
  onReset,
  resultCount,
  totalCount,
}: StoreSidebarProps) {
  const [showMobile, setShowMobile] = useState(false)

  const stats = useMemo(() => {
    const categoryCounts: Record<string, number> = {}
    const industryCounts: Record<string, number> = {}
    const fileTypeCounts: Record<string, number> = {}
    let saleCount = 0
    let featuredCount = 0
    let minPrice = Infinity
    let maxPrice = 0

    for (const p of products) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
      if (p.industry) industryCounts[p.industry] = (industryCounts[p.industry] || 0) + 1
      if (p.fileType) fileTypeCounts[p.fileType] = (fileTypeCounts[p.fileType] || 0) + 1
      if (p.salePrice) saleCount++
      if (p.featured) featuredCount++
      const price = p.salePrice ?? p.price
      if (price < minPrice) minPrice = price
      if (price > maxPrice) maxPrice = price
    }

    return { categoryCounts, industryCounts, fileTypeCounts, saleCount, featuredCount, minPrice, maxPrice }
  }, [products])

  const activeFilters = [
    activeCategory !== "All" && { label: activeCategory, clear: () => onCategoryChange("All") },
    minRating > 0 && { label: `${minRating}+ Stars`, clear: () => onMinRatingChange(0) },
    onSaleOnly && { label: "On Sale", clear: () => onOnSaleOnlyChange(false) },
    featuredOnly && { label: "Featured", clear: () => onFeaturedOnlyChange(false) },
    fileTypes.length > 0 && { label: `${fileTypes.length} file type${fileTypes.length > 1 ? "s" : ""}`, clear: () => onFileTypesChange([]) },
    industries.length > 0 && { label: `${industries.length} industry${industries.length > 1 ? "ies" : ""}`, clear: () => onIndustriesChange([]) },
    (priceRange[0] > stats.minPrice || priceRange[1] < stats.maxPrice) && {
      label: `$${priceRange[0].toFixed(2)} - $${priceRange[1].toFixed(2)}`,
      clear: () => onPriceRangeChange([stats.minPrice, stats.maxPrice]),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  const sidebarContent = (
    <div className="space-y-0">
      {/* Search */}
      <div className="pb-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 border-border bg-surface pl-10 text-sm focus:bg-white"
          />
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Filters</span>
            <button onClick={onReset} className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1">
              <RotateCcw className="h-3 w-3" /> Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((f, i) => (
              <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1 bg-primary/5 text-primary border border-primary/10">
                {f.label}
                <button onClick={f.clear} className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <FilterSection title="Categories" icon={<FolderOpen className="h-4 w-4" />}>
        <div className="space-y-1">
          {allCategories.map((cat) => {
            const count = cat === "All" ? products.length : (stats.categoryCounts[cat] || 0)
            if (cat !== "All" && count === 0) return null
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
                  activeCategory === cat
                    ? "bg-primary text-white font-medium shadow-sm"
                    : "text-muted hover:bg-surface hover:text-foreground"
                )}
              >
                <span className="truncate">{cat}</span>
                <span className={cn(
                  "text-xs font-medium rounded-full px-2 py-0.5 min-w-[28px] text-center",
                  activeCategory === cat
                    ? "bg-white/20 text-white"
                    : "bg-surface text-muted"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" icon={<DollarSign className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-muted font-medium">Min</label>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => onPriceRangeChange([Number(e.target.value) || 0, priceRange[1]])}
                className="h-9 text-xs mt-1"
                min={0}
              />
            </div>
            <span className="mt-5 text-muted text-xs">—</span>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-muted font-medium">Max</label>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value) || stats.maxPrice])}
                className="h-9 text-xs mt-1"
                min={0}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted">
            Range: ${stats.minPrice.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })} - ${stats.maxPrice.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })}
          </p>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Minimum Rating" icon={<Star className="h-4 w-4" />}>
        <div className="space-y-1">
          {[4, 3, 2, 1, 0].map((r) => (
            <button
              key={r}
              onClick={() => onMinRatingChange(r)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                minRating === r
                  ? "bg-accent/10 text-accent font-medium border border-accent/20"
                  : "text-muted hover:bg-surface"
              )}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn("h-3.5 w-3.5", i < r ? "fill-accent text-accent" : "text-border")}
                  />
                ))}
              </div>
              <span className="text-xs">{r === 0 ? "All ratings" : `${r}+ stars`}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Industries */}
      <FilterSection title="Industry" icon={<Building2 className="h-4 w-4" />}>
        <div className="space-y-1">
          {allIndustries.map((ind) => {
            const count = stats.industryCounts[ind] || 0
            if (count === 0) return null
            const active = industries.includes(ind)
            return (
              <label
                key={ind}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all",
                  active ? "bg-primary/5 text-primary" : "text-muted hover:bg-surface"
                )}
              >
                <Checkbox
                  checked={active}
                  onCheckedChange={() => {
                    if (active) {
                      onIndustriesChange(industries.filter((i) => i !== ind))
                    } else {
                      onIndustriesChange([...industries, ind])
                    }
                  }}
                />
                <span className="flex-1 truncate">{ind}</span>
                <span className="text-xs text-muted">{count}</span>
              </label>
            )
          })}
        </div>
      </FilterSection>

      {/* File Type */}
      <FilterSection title="File Type" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-1">
          {allFileTypes.map((ft) => {
            const count = stats.fileTypeCounts[ft] || 0
            if (count === 0) return null
            const active = fileTypes.includes(ft)
            return (
              <label
                key={ft}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all",
                  active ? "bg-primary/5 text-primary" : "text-muted hover:bg-surface"
                )}
              >
                <Checkbox
                  checked={active}
                  onCheckedChange={() => {
                    if (active) {
                      onFileTypesChange(fileTypes.filter((f) => f !== ft))
                    } else {
                      onFileTypesChange([...fileTypes, ft])
                    }
                  }}
                />
                <span className="flex-1 truncate">{ft}</span>
                <span className="text-xs text-muted">{count}</span>
              </label>
            )
          })}
        </div>
      </FilterSection>

      {/* Quick Toggles */}
      <FilterSection title="Quick Filters" icon={<SlidersHorizontal className="h-4 w-4" />}>
        <div className="space-y-2">
          <label className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:bg-surface transition-all">
            <span className="flex items-center gap-2 text-muted">
              <Percent className="h-4 w-4" />
              On Sale Only
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5">{stats.saleCount}</Badge>
            <Checkbox
              checked={onSaleOnly}
              onCheckedChange={(v) => onOnSaleOnlyChange(v === true)}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:bg-surface transition-all">
            <span className="flex items-center gap-2 text-muted">
              <Sparkles className="h-4 w-4" />
              Featured Only
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5">{stats.featuredCount}</Badge>
            <Checkbox
              checked={featuredOnly}
              onCheckedChange={(v) => onFeaturedOnlyChange(v === true)}
            />
          </label>
        </div>
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort By" icon={<BarChart3 className="h-4 w-4" />}>
        <div className="space-y-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={cn(
                "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-all",
                sort === opt.value
                  ? "bg-primary text-white font-medium"
                  : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Results summary */}
      <div className="pt-4 border-t border-border">
        <div className="rounded-xl bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-primary font-heading">{resultCount}</p>
          <p className="text-xs text-muted mt-1">
            template{resultCount === 1 ? "" : "s"} found
            {resultCount < totalCount && (
              <span> of {totalCount}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setShowMobile(!showMobile)}
        className="lg:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary/90 transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeFilters.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary">
            {activeFilters.length}
          </span>
        )}
      </button>

      {/* Mobile overlay */}
      {showMobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobile(false)} />
          <div className="absolute right-0 top-0 h-full w-[340px] max-w-[85vw] overflow-y-auto bg-white shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-semibold text-primary">Filters</h3>
              <button onClick={() => setShowMobile(false)} className="rounded-lg p-1.5 hover:bg-surface">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[280px] shrink-0">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-hide">
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold text-primary flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-accent" />
                Filters
              </h3>
              {activeFilters.length > 0 && (
                <button onClick={onReset} className="text-xs text-accent hover:text-accent/80 font-medium">
                  Reset
                </button>
              )}
            </div>
            {sidebarContent}
          </div>
        </div>
      </aside>
    </>
  )
}
