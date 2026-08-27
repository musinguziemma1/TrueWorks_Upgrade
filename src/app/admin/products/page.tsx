"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Package, Plus, Search, Grid3X3, List, Edit3, Trash2,
  Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, FileText, Archive, DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
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
      <AdminPageHeader
        title="Products"
        description="Manage your digital products"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Products" }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCsv} disabled={total === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Export
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Link href="/admin/products/new">
              <Button><Plus className="h-4 w-4" /> Add Product</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Published", value: productStats?.published ?? 0, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Drafts", value: productStats?.draft ?? 0, icon: FileText, color: "text-amber-600" },
          { label: "Archived", value: productStats?.archived ?? 0, icon: Archive, color: "text-slate-600" },
          { label: "Est. Revenue", value: fmtPrice(productStats?.totalRevenue ?? 0), icon: DollarSign, color: "text-[#0B2545]" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={(v) => { if (v) setCategory(v) }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={industry} onValueChange={(v) => { if (v) setIndustry(v) }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { if (v) setStatus(v) }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex rounded-md border border-border overflow-hidden">
          <button onClick={() => setViewMode("list")} className={cn("p-2.5 transition-colors", viewMode === "list" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-foreground")}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("grid")} className={cn("p-2.5 transition-colors", viewMode === "grid" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-foreground")}>
            <Grid3X3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-destructive/10 rounded-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Select value="" onValueChange={(v) => { if (v) { handleBulkStatus(v as ProductStatus) } }}>
            <SelectTrigger className="w-[180px] h-8 bg-white text-xs"><SelectValue placeholder="Set status..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Publish selected</SelectItem>
              <SelectItem value="draft">Move to draft</SelectItem>
              <SelectItem value="archived">Archive selected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={() => setConfirmBulkDelete(true)} disabled={bulkBusy}>
            Delete Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardAction>
              <span className="text-sm text-muted-foreground hidden sm:inline-block">{total} products found</span>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selected.size === paginated.length && paginated.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((product) => (
                  <TableRow key={product._id} className={selected.has(product._id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox checked={selected.has(product._id)} onCheckedChange={() => toggleSelect(product._id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {product.thumbnail ? (
                            <Image src={product.thumbnail} alt={product.name} fill sizes="40px" className="object-cover rounded-lg" />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right font-medium">
                      {product.salePrice ? (
                        <span>
                          <span className="text-primary">{fmtPrice(product.salePrice)}</span>
                          <span className="text-muted-foreground line-through ml-1 text-xs">{fmtPrice(product.price)}</span>
                        </span>
                      ) : (
                        fmtPrice(product.price)
                      )}
                    </TableCell>
                    <TableCell className="text-right">{product.totalSales}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={product.status === "published" ? "Active" : product.status === "draft" ? "Draft" : "Archived"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/products/${product._id}/edit`}>
                          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit" aria-label={`Edit ${product.name}`}>
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
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
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((product) => (
            <Card key={product._id} className="p-4 hover:shadow-card transition-shadow">
              <div className="relative w-full h-32 rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center mb-3 overflow-hidden">
                {product.thumbnail ? (
                  <Image src={product.thumbnail} alt={product.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
                ) : (
                  <Package className="h-10 w-10 text-primary/40" />
                )}
              </div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <StatusBadge status={product.status === "published" ? "Active" : product.status === "draft" ? "Draft" : "Archived"} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-primary">
                  {product.salePrice ? fmtPrice(product.salePrice) : fmtPrice(product.price)}
                </span>
                <span className="text-muted-foreground">{product.totalSales} sales</span>
              </div>
            </Card>
          ))}
          {total === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<Package className="h-12 w-12" />}
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
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
