"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Package, Plus, Search, Grid3X3, List, Edit3, Copy, Trash2,
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

interface Product {
  id: string; name: string; sku: string; category: string; price: string
  sales: number; status: "Active" | "Draft" | "Archived"; thumbnail: string; industry: string
}

const products: Product[] = [
  { id: "1", name: "Business Template Pro", sku: "BT-001", category: "Templates", industry: "Business", price: "UGX 125,000", sales: 342, status: "Active", thumbnail: "BT" },
  { id: "2", name: "Admin Dashboard Kit", sku: "AD-002", category: "Dashboards", industry: "Technology", price: "UGX 89,000", sales: 256, status: "Active", thumbnail: "AD" },
  { id: "3", name: "E-commerce Bundle", sku: "EC-003", category: "Bundles", industry: "E-commerce", price: "UGX 250,000", sales: 189, status: "Active", thumbnail: "EB" },
  { id: "4", name: "UI Component Pack", sku: "UI-004", category: "Components", industry: "Design", price: "UGX 45,000", sales: 423, status: "Active", thumbnail: "UI" },
  { id: "5", name: "Marketing Suite", sku: "MK-005", category: "Marketing", industry: "Marketing", price: "UGX 67,000", sales: 167, status: "Draft", thumbnail: "MS" },
  { id: "6", name: "Analytics Dashboard", sku: "AN-006", category: "Dashboards", industry: "Analytics", price: "UGX 95,000", sales: 134, status: "Active", thumbnail: "AN" },
  { id: "7", name: "SaaS Landing Page", sku: "SL-007", category: "Templates", industry: "SaaS", price: "UGX 55,000", sales: 298, status: "Active", thumbnail: "SL" },
  { id: "8", name: "Invoice Generator", sku: "IG-008", category: "Tools", industry: "Finance", price: "UGX 35,000", sales: 512, status: "Active", thumbnail: "IG" },
  { id: "9", name: "Portfolio Template", sku: "PF-009", category: "Templates", industry: "Creative", price: "UGX 29,000", sales: 876, status: "Active", thumbnail: "PT" },
  { id: "10", name: "CRM Software Kit", sku: "CRM-010", category: "Software", industry: "CRM", price: "UGX 195,000", sales: 89, status: "Archived", thumbnail: "CK" },
  { id: "11", name: "Social Media Pack", sku: "SM-011", category: "Marketing", industry: "Social Media", price: "UGX 49,000", sales: 234, status: "Draft", thumbnail: "SM" },
  { id: "12", name: "HR Dashboard", sku: "HR-012", category: "Dashboards", industry: "HR", price: "UGX 79,000", sales: 156, status: "Active", thumbnail: "HR" },
]

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [industry, setIndustry] = useState("All")
  const [status, setStatus] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const perPage = 8

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false
    if (category !== "All" && p.category !== category) return false
    if (industry !== "All" && p.industry !== industry) return false
    if (status !== "All" && p.status !== status) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set())
    else setSelected(new Set(paginated.map((p) => p.id)))
  }

  const categories = ["All", ...new Set(products.map((p) => p.category))]
  const industries = ["All", ...new Set(products.map((p) => p.industry))]
  const statuses = ["All", "Active", "Draft", "Archived"]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description="Manage your digital products"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Products" }]}
        action={
          <Link href="/admin/products/new">
            <Button><Plus className="h-4 w-4" /> Add Product</Button>
          </Link>
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

      {viewMode === "list" ? (
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
                  <TableRow key={product.id} className={selected.has(product.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox checked={selected.has(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{product.thumbnail}</div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right font-medium">{product.price}</TableCell>
                    <TableCell className="text-right">{product.sales}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={product.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit"><Edit3 className="h-4 w-4" /></button>
                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Duplicate"><Copy className="h-4 w-4" /></button>
                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
            <Card key={product.id} className="p-4 hover:shadow-card transition-shadow">
              <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center mb-3">
                <Package className="h-10 w-10 text-primary/40" />
              </div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <StatusBadge status={product.status} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-primary">{product.price}</span>
                <span className="text-muted-foreground">{product.sales} sales</span>
              </div>
            </Card>
          ))}
          {paginated.length === 0 && (
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
    </div>
  )
}
