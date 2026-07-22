"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  Package, Plus, Search, Grid3X3, List, Edit3, Trash2,
  Upload, Download, FileSpreadsheet, Loader2,
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
import {
  useProducts,
  deleteProduct,
  bulkImportProducts,
  ProductStatus,
} from "@/lib/admin-queries"
import { toast } from "sonner"
import * as XLSX from "xlsx"

const STATUS_MAP: Record<string, ProductStatus> = {
  Active: "published",
  Draft: "draft",
  Archived: "archived",
}

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(n)

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [industry, setIndustry] = useState("All")
  const [status, setStatus] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const products = useProducts()
  const removeProduct = deleteProduct.useMutation()
  const importProducts = bulkImportProducts.useMutation()

  const isLoading = products === undefined

  const filtered = (products ?? []).filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false
    if (category !== "All" && p.category !== category) return false
    if (industry !== "All" && p.industry !== industry) return false
    if (status !== "All" && p.status !== STATUS_MAP[status]) return false
    return true
  })

  const perPage = 8
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const categories = ["All", ...new Set((products ?? []).map((p) => p.category))]
  const industries = ["All", ...new Set((products ?? []).map((p) => p.industry))]
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
    if (!confirm("Delete this product?")) return
    try {
      await removeProduct({ id: id as never })
      toast.success("Product deleted")
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} products?`)) return
    for (const id of selected) {
      await removeProduct({ id: id as never })
    }
    setSelected(new Set())
    toast.success("Products deleted")
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
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" /> Import
            </Button>
            <Link href="/admin/products/new">
              <Button><Plus className="h-4 w-4" /> Add Product</Button>
            </Link>
          </div>
        }
      />

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
        <Select value={category} onValueChange={(v) => { if (v) { setCategory(v); setPage(1) } }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={industry} onValueChange={(v) => { if (v) { setIndustry(v); setPage(1) } }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { if (v) { setStatus(v); setPage(1) } }}>
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
        <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Delete Selected</Button>
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
              <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} products found</span>
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
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt="" className="w-full h-full object-cover rounded-lg" />
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
                          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                          title="Delete"
                          onClick={() => handleDelete(product._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
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
              <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center mb-3 overflow-hidden">
                {product.thumbnail ? (
                  <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
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
          {filtered.length === 0 && (
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
