"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Tags,
  Loader2,
  FileSpreadsheet,
  X,
  BarChart3,
  FolderOpen,
  ArrowRight,
  Layers,
  Package,
  Globe,
} from "lucide-react"
import type { Doc } from "@convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { downloadCsv, toCsv } from "@/lib/csv"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  useCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryInput,
} from "@/lib/admin-queries"

type CategoryDoc = Doc<"categories">

const INDUSTRIES = [
  "Business",
  "Technology",
  "E-commerce",
  "Design",
  "Marketing",
  "Analytics",
  "SaaS",
  "Finance",
  "Creative",
  "CRM",
  "Social Media",
  "HR",
  "Education",
]

const INDUSTRY_COLORS: Record<string, string> = {
  Business: "text-blue-600",
  Technology: "text-violet-600",
  "E-commerce": "text-emerald-600",
  Design: "text-pink-600",
  Marketing: "text-orange-600",
  Analytics: "text-cyan-600",
  SaaS: "text-indigo-600",
  Finance: "text-amber-600",
  Creative: "text-fuchsia-600",
  CRM: "text-teal-600",
  "Social Media": "text-rose-600",
  HR: "text-lime-600",
  Education: "text-sky-600",
}

export default function CategoriesPage() {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
  const [industryFilter, setIndustryFilter] = useState<string>("all")
  const [editCategory, setEditCategory] = useState<CategoryDoc | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [industry, setIndustry] = useState("")

  const categories = useCategories()
  const create = createCategory.useMutation()
  const update = updateCategory.useMutation()
  const remove = deleteCategory.useMutation()

  const isLoading = categories === undefined

  const filtered = useMemo(() => {
    const rows = categories ?? []
    const searchLower = search.toLowerCase()
    return rows.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchLower) ||
        c.slug.toLowerCase().includes(searchLower) ||
        (c.code ?? "").toLowerCase().includes(searchLower) ||
        (c.description ?? "").toLowerCase().includes(searchLower)
      const matchesIndustry = industryFilter === "all" || c.industry === industryFilter
      return matchesSearch && matchesIndustry
    })
  }, [categories, search, industryFilter])

  const stats = useMemo(() => {
    const rows = categories ?? []
    const totalProducts = rows.reduce((sum, c) => sum + (c.productCount ?? 0), 0)
    const industries = new Set(rows.map((c) => c.industry).filter(Boolean))
    const withProducts = rows.filter((c) => (c.productCount ?? 0) > 0).length
    return {
      total: rows.length,
      totalProducts,
      industries: industries.size,
      withProducts,
    }
  }, [categories])

  const handleExportCsv = () => {
    const csv = toCsv(
      filtered.map((c) => ({
        code: c.code ?? "",
        name: c.name,
        slug: c.slug,
        industry: c.industry ?? "",
        description: c.description ?? "",
        productCount: c.productCount,
      }))
    )
    downloadCsv(`categories-${new Date().toISOString().slice(0, 10)}`, csv)
  }

  const perPage = 10
  const totalPages = Math.ceil(filtered.length / perPage)
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const openNewDialog = () => {
    setEditCategory(null)
    setName("")
    setSlug("")
    setCode("")
    setDescription("")
    setIndustry("")
    setDialogOpen(true)
  }

  const openEditDialog = (cat: CategoryDoc) => {
    setEditCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setCode(cat.code ?? "")
    setDescription(cat.description ?? "")
    setIndustry(cat.industry || "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name || !slug) {
      toast.error("Name and slug are required")
      return
    }
    const payload: CategoryInput = {
      name,
      slug,
      code: code || undefined,
      description: description || undefined,
      industry: industry || undefined,
    }
    try {
      if (editCategory) {
        await update({ id: editCategory._id as never, ...payload } as never)
        toast.success("Category updated")
      } else {
        await create(payload as never)
        toast.success("Category created")
      }
      setDialogOpen(false)
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      await remove({ id: deleteId as never })
      toast.success("Category deleted")
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const statCards = [
    {
      label: "Total Categories",
      value: stats.total,
      icon: FolderOpen,
      tint: "text-primary bg-primary/5",
      footnote: "All product categories",
    },
    {
      label: "Products Assigned",
      value: stats.totalProducts,
      icon: Package,
      tint: "text-emerald-700 bg-emerald-50/80",
      footnote: "Across all categories",
    },
    {
      label: "Industries",
      value: stats.industries,
      icon: Globe,
      tint: "text-secondary bg-secondary/5",
      footnote: "Industry segments",
    },
    {
      label: "Active Categories",
      value: stats.withProducts,
      icon: Layers,
      tint: "text-amber-700 bg-amber-50/80",
      footnote: "Categories with products",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#0F3058] px-6 py-8 lg:px-8 lg:py-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
              <a href="/admin" className="transition-colors hover:text-white/80">
                Dashboard
              </a>
              <ArrowRight className="h-3 w-3" />
              <span className="text-white/70">Categories</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Product Categories
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Organize your digital products with categories and industry tags
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              size="sm"
              className="bg-accent text-primary-dark hover:bg-accent/90"
              onClick={openNewDialog}
            >
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.tint)}>
                  <s.icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                {isLoading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  s.value
                )}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{s.footnote}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, slug, code or description..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            className="h-10 pl-10 pr-9"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("")
                setPage(1)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select
          value={industryFilter}
          onValueChange={(v) => {
            setIndustryFilter(v ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
              <Tags className="h-4 w-4" />
            </span>
            <CardTitle>Categories</CardTitle>
          </div>
          <CardAction>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              {filtered.length} {filtered.length === 1 ? "category" : "categories"}
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : paginated.length === 0 ? (
            <EmptyState
              icon={<Tags className="h-12 w-12" />}
              title="No categories found"
              description={
                search || industryFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Create your first category to organize your products."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 text-primary">Code</TableHead>
                    <TableHead className="text-primary">Name</TableHead>
                    <TableHead className="text-primary">Slug</TableHead>
                    <TableHead className="text-primary">Industry</TableHead>
                    <TableHead className="text-center text-primary">Products</TableHead>
                    <TableHead className="w-20 text-right text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((cat) => {
                    const productCount = cat.productCount ?? 0
                    const industryColor = cat.industry
                      ? INDUSTRY_COLORS[cat.industry] ?? "text-muted-foreground"
                      : null
                    return (
                      <TableRow key={cat._id} className="group transition-colors hover:bg-muted/40">
                        <TableCell className="pl-4">
                          <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-foreground">
                            {cat.code ?? "—"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{cat.name}</span>
                            {cat.description && (
                              <span className="hidden text-xs text-muted-foreground lg:inline">
                                {cat.description.length > 40
                                  ? cat.description.slice(0, 40) + "..."
                                  : cat.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs text-muted-foreground">{cat.slug}</code>
                        </TableCell>
                        <TableCell>
                          {cat.industry ? (
                            <span className={cn("text-sm font-medium", industryColor)}>
                              {cat.industry}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                              productCount > 0
                                ? "bg-primary/5 text-primary"
                                : "bg-muted/50 text-muted-foreground"
                            )}
                          >
                            {productCount}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => openEditDialog(cat)}
                              aria-label={`Edit ${cat.name}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteId(cat._id)}
                              aria-label={`Delete ${cat.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(safePage - 1) * perPage + 1}
            </span>
            {" "}-{" "}
            <span className="font-medium text-foreground">
              {Math.min(safePage * perPage, filtered.length)}
            </span>
            {" "}of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages || totalPages === 0}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null)
        }}
        title="Delete this category?"
        description="Products in this category will not be deleted, but their category reference will be orphaned. This action cannot be undone."
        confirmLabel="Delete category"
        destructive
        onConfirm={handleDelete}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="category-slug"
              />
            </div>
            <div className="space-y-2">
              <Label>Family Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="TW-EXE"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={(v) => setIndustry(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSave}>
              {editCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
