"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Package, Plus, Search, Grid3X3, List, Edit3, Trash2,
  Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, FileText, Archive, DollarSign,
  TrendingUp, ChevronRight, Filter, BarChart3, Star, Eye, X as XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import {
  useProducts,
  deleteProduct,
  bulkImportProducts,
  ProductStatus,
} from "@/lib/admin-queries"
import { useProductStats } from "@/lib/admin-queries"
import { downloadCsv, toCsv } from "@/lib/csv"
import { toast } from "sonner"


const STATUS_MAP: Record<string, ProductStatus> = {
  Active: "published",
  Draft: "draft",
  Archived: "archived",
}

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [category, setCategoryState] = useState("All")
  const [industry, setIndustryState] = useState("All")
  const [status, setStatusState] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [page, setPage] = useState(1)

  // Reset to first page whenever a filter changes.
  const setCategory = (v: string) => { setCategoryState(v); setPage(1) }
  const setIndustry = (v: string) => { setIndustryState(v); setPage(1) }
  const setStatus = (v: string) => { setStatusState(v); setPage(1) }
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const perPage = 8

  const products = useProducts({
    category: category !== "All" ? category : undefined,
    industry: industry !== "All" ? industry : undefined,
    status: status !== "All" ? STATUS_MAP[status] : undefined,
    search: debouncedSearch || undefined,
    limit: perPage,
    offset: (page - 1) * perPage,
  })
  const productStats = useProductStats()
  const removeProduct = deleteProduct.useMutation()
  const importProducts = bulkImportProducts.useMutation()
  const setStatusBulk = useMutation(api.products.bulkSetStatus)
  const bulkRemove = useMutation(api.products.bulkRemove)

  const isLoading = products === undefined
  const items = products?.items ?? []
  const total = products?.total ?? 0

  const totalPages = Math.ceil(total / perPage)
  const paginated = items

  const categories = ["All", ...new Set(items.map((p) => p.category))]
  const industries = ["All", ...new Set(items.map((p) => p.industry))]
  const statuses = ["All", "Active", "Draft", "Archived"]

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set())
    else setSelected(new Set(paginated.map((p) => p._id)))
  }

  const handleDelete = async (id: string) => {
    try {
      await removeProduct({ id: id as never })
      toast.success("Product deleted")
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleteId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    try {
      setBulkBusy(true)
      const deleted = await bulkRemove({ ids: Array.from(selected) as never })
      setSelected(new Set())
      toast.success(`Deleted ${deleted} product${deleted === 1 ? "" : "s"}`)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setBulkBusy(false)
      setConfirmBulkDelete(false)
    }
  }

  const handleBulkStatus = async (status: ProductStatus) => {
    if (selected.size === 0) return
    try {
      const changed = await setStatusBulk({ ids: Array.from(selected) as never, status })
      toast.success(`Updated ${changed} products to ${status}`)
      setSelected(new Set())
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleExportCsv = () => {
    const csv = toCsv(
      items.map((p) => ({
        name: p.name,
        sku: p.sku,
        category: p.category,
        industry: p.industry,
        price: p.salePrice ?? p.price,
        status: p.status,
        sales: p.totalSales,
        featured: p.featured ? "yes" : "no",
      }))
    )
    downloadCsv(`products-${new Date().toISOString().slice(0, 10)}`, csv)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      toast.error("Please select a file")
      return
    }

    setImporting(true)
    try {
      // Lazy-load xlsx (~500KB) only when bulk-importing
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: Record<string, string | number | boolean>[] = XLSX.utils.sheet_to_json(sheet)

      const products = rows.map((row) => ({
        name: String(row["Name"] ?? row["name"] ?? ""),
        slug: String(row["Slug"] ?? row["slug"] ?? ""),
        sku: String(row["SKU"] ?? row["sku"] ?? ""),
        shortDescription: String(row["Short Description"] ?? row["shortDescription"] ?? ""),
        description: String(row["Description"] ?? row["description"] ?? ""),
        price: Number(row["Price"] ?? row["price"] ?? 0),
        salePrice: row["Sale Price"] ?? row["salePrice"] ? Number(row["Sale Price"] ?? row["salePrice"]) : undefined,
        category: String(row["Category"] ?? row["category"] ?? "General"),
        industry: String(row["Industry"] ?? row["industry"] ?? "Business"),
        fileType: String(row["File Type"] ?? row["fileType"] ?? "ZIP"),
        tags: String(row["Tags"] ?? row["tags"] ?? "").split(",").map((t: string) => t.trim()).filter(Boolean),
        galleryImages: String(row["Gallery Images"] ?? row["galleryImages"] ?? "").split(",").map((u: string) => u.trim()).filter(Boolean),
        thumbnail: String(row["Thumbnail"] ?? row["thumbnail"] ?? ""),
        downloadableFile: row["Downloadable File"] ?? row["downloadableFile"] ? String(row["Downloadable File"] ?? row["downloadableFile"]) : undefined,
        fileSize: row["File Size"] ?? row["fileSize"] ? String(row["File Size"] ?? row["fileSize"]) : undefined,
        version: row["Version"] ?? row["version"] ? String(row["Version"] ?? row["version"]) : undefined,
        featured: Boolean(row["Featured"] ?? row["featured"] ?? false),
        status: (String(row["Status"] ?? row["status"] ?? "draft") as ProductStatus) || "draft",
      })).filter((p) => p.name && p.slug)

      const results = await importProducts({ products: products as never })
      const success = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length
      toast.success(`Imported ${success} products${failed > 0 ? `, ${failed} failed` : ""}`)
      setImportDialogOpen(false)
    } catch (e) {
      toast.error(`Import failed: ${String(e)}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#071A33] to-[#071A33] px-6 py-8 lg:px-8 lg:py-10">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-accent/[0.10] blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[24rem] w-[24rem] rounded-full bg-blue-500/[0.10] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.05] blur-3xl" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "400px 400px",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-white/60">
              <Link href="/admin" className="transition-colors hover:text-white">Dashboard</Link>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="font-semibold text-white">Products</span>
            </nav>
            <h1 className="mt-3 font-heading text-3xl font-semibold text-white md:text-4xl">
              Products
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Manage your digital product catalog. {total > 0 && `${total} ${total === 1 ? "product" : "products"} total`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={total === 0}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Link href="/admin/products/new">
              <Button className="gradient-gold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats row: featured Est. revenue + 3 small cards ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="gradient-brand relative overflow-hidden rounded-2xl p-6 shadow-elevated lg:col-span-1">
          <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">
                Estimated Revenue
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent-light">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 font-heading text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">
              {fmtPrice(productStats?.totalRevenue ?? 0)}
            </p>
            <p className="mt-2 text-xs text-white/70">
              Across all published templates
            </p>
            <Link
              href="/admin/analytics"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-light transition-transform hover:translate-x-0.5"
            >
              Open analytics
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 lg:col-span-3">
          {[
            { label: "Published", value: productStats?.published ?? 0, icon: CheckCircle2, tint: "text-emerald-700 bg-emerald-50", footnote: "Live in store" },
            { label: "Drafts", value: productStats?.draft ?? 0, icon: FileText, tint: "text-amber-700 bg-amber-50", footnote: "Not yet visible" },
            { label: "Archived", value: productStats?.archived ?? 0, icon: Archive, tint: "text-muted bg-surface", footnote: "Retired" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.tint)}>
                    <s.icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{s.footnote}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-10 pl-10 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setPage(1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </div>
          <Select value={category} onValueChange={(v) => { if (v) setCategory(v) }}>
            <SelectTrigger className="h-10 w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={industry} onValueChange={(v) => { if (v) setIndustry(v) }}>
            <SelectTrigger className="h-10 w-[150px]"><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { if (v) setStatus(v) }}>
            <SelectTrigger className="h-10 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-2.5 transition-colors", viewMode === "list" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-foreground")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-2.5 transition-colors", viewMode === "grid" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-foreground")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-elevated backdrop-blur-sm">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
              {selected.size}
            </span>
            {selected.size === 1 ? "product selected" : "products selected"}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select value="" onValueChange={(v) => { if (v) { handleBulkStatus(v as ProductStatus) } }}>
              <SelectTrigger className="h-9 w-[200px] bg-white text-xs"><SelectValue placeholder="Change status to..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Publish selected
                  </span>
                </SelectItem>
                <SelectItem value="draft">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-amber-600" /> Move to draft
                  </span>
                </SelectItem>
                <SelectItem value="archived">
                  <span className="inline-flex items-center gap-1.5">
                    <Archive className="h-3.5 w-3.5 text-muted-foreground" /> Archive selected
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={() => setConfirmBulkDelete(true)} disabled={bulkBusy}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <XIcon className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === "list" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </span>
              <CardTitle>Products</CardTitle>
            </div>
            <CardAction>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                {total} {total === 1 ? "product" : "products"} found
              </span>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={selected.size === paginated.length && paginated.length > 0}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-10 pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((product) => (
                  <TableRow
                    key={product._id}
                    className={cn(
                      "group transition-colors",
                      selected.has(product._id) ? "bg-primary/5" : "hover:bg-muted/40"
                    )}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected.has(product._id)}
                        onCheckedChange={() => toggleSelect(product._id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/80 to-primary">
                          {product.thumbnail ? (
                            <Image
                              src={product.thumbnail}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-5 w-5 text-white/70" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-foreground">{product.name}</span>
                            {product.featured && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-dark">
                                <Star className="h-2.5 w-2.5 fill-current" /> Featured
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="font-mono">{product.sku}</span>
                            <span className="text-border">·</span>
                            <span className="rounded-full bg-primary/[0.06] px-2 py-0.5 font-medium text-primary">
                              {product.category}
                            </span>
                            {product.industry && (
                              <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-muted-foreground">
                                {product.industry}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.salePrice ? (
                        <div className="flex flex-col items-end">
                          <span className="font-heading text-sm font-bold text-primary">
                            {fmtPrice(product.salePrice)}
                          </span>
                          <span className="text-[11px] text-muted-foreground line-through">
                            {fmtPrice(product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-heading text-sm font-bold text-foreground">
                          {fmtPrice(product.price)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5 text-sm">
                        <span className="font-semibold tabular-nums text-foreground">
                          {product.totalSales}
                        </span>
                        <span className="text-[11px] text-muted-foreground">sold</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge
                        status={
                          product.status === "published"
                            ? "Active"
                            : product.status === "draft"
                              ? "Draft"
                              : "Archived"
                        }
                      />
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/store/${(product as { slug?: string }).slug ?? product._id}`} target="_blank">
                          <button
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                            title="View in store"
                            aria-label={`View ${product.name} in store`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <Link href={`/admin/products/${product._id}/edit`}>
                          <button
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Edit"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                          title="Delete"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => setDeleteId(product._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {total === 0 && (
              <EmptyState
                icon={<Package className="h-12 w-12" />}
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
                action={
                  <Link href="/admin/products/new">
                    <Button>
                      <Plus className="h-4 w-4" /> Add your first product
                    </Button>
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((product) => (
            <Card
              key={product._id}
              className={cn(
                "group relative overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-elevated",
                selected.has(product._id) && "ring-2 ring-primary/40"
              )}
            >
              <div className="absolute right-3 top-3 z-10">
                <Checkbox
                  checked={selected.has(product._id)}
                  onCheckedChange={() => toggleSelect(product._id)}
                  aria-label={`Select ${product.name}`}
                  className="border-white/60 bg-white/80 shadow-sm backdrop-blur-sm data-[state=checked]:bg-primary"
                />
              </div>
              {product.featured && (
                <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-dark shadow-md">
                  <Star className="h-2.5 w-2.5 fill-current" /> Featured
                </span>
              )}
              <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/80 to-primary">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-12 w-12 text-white/30" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 translate-y-2 px-3 py-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/95 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm transition-colors hover:bg-white"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <Link
                      href={`/store/${(product as { slug?: string }).slug ?? product._id}`}
                      target="_blank"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-primary backdrop-blur-sm transition-colors hover:bg-white"
                      aria-label={`View ${product.name} in store`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => setDeleteId(product._id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-destructive backdrop-blur-sm transition-colors hover:bg-red-50"
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {product.sku}
                    </p>
                  </div>
                  <StatusBadge
                    status={
                      product.status === "published"
                        ? "Active"
                        : product.status === "draft"
                          ? "Draft"
                          : "Archived"
                    }
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="rounded-full bg-primary/[0.06] px-2 py-0.5 text-[10px] font-medium text-primary">
                    {product.category}
                  </span>
                  {product.industry && (
                    <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {product.industry}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                  <div>
                    {product.salePrice ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-heading text-base font-bold text-primary">
                          {fmtPrice(product.salePrice)}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-through">
                          {fmtPrice(product.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-heading text-base font-bold text-foreground">
                        {fmtPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span className="font-semibold tabular-nums text-foreground">
                      {product.totalSales}
                    </span>
                    <span>sold</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {total === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<Package className="h-12 w-12" />}
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
                action={
                  <Link href="/admin/products/new">
                    <Button>
                      <Plus className="h-4 w-4" /> Add your first product
                    </Button>
                  </Link>
                }
              />
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(page - 1) * perPage + 1}</span> to{" "}
            <span className="font-semibold text-foreground">{Math.min(page * perPage, total)}</span> of{" "}
            <span className="font-semibold text-foreground">{total}</span> products
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="Delete this product?"
        description="This permanently removes the product, its files, and detaches it from any categories. This action cannot be undone."
        confirmLabel="Delete product"
        destructive
        onConfirm={async () => { if (deleteId) await handleDelete(deleteId) }}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={(open) => { if (!open && !bulkBusy) setConfirmBulkDelete(false) }}
        title={`Delete ${selected.size} product${selected.size === 1 ? "" : "s"}?`}
        description="This permanently removes all selected products in a single transaction. Any associated downloads and license records will remain but become orphaned. This action cannot be undone."
        confirmLabel={`Delete ${selected.size} product${selected.size === 1 ? "" : "s"}`}
        destructive
        onConfirm={handleBulkDelete}
      />

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Import Products from Excel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Upload an Excel file (.xlsx or .csv) with product data. Required columns: Name, Slug, SKU, Price, Category, Industry.
            </p>
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {fileName || "Click to select Excel file"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .csv up to 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium mb-1">Excel columns supported:</p>
              <p className="text-xs text-muted-foreground">
                Name, Slug, SKU, ShortDescription, Description, Price, SalePrice, Category, Industry, FileType, Tags, Thumbnail, Featured, Status
              </p>
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !fileName}>
              {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</> : <><Download className="h-4 w-4" /> Import Products</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
