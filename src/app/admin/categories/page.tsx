"use client"

import { useState } from "react"
import { Plus, Edit3, Trash2, Search, Tags, Loader2 } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  useCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryInput,
} from "@/lib/admin-queries"

interface CategoryDoc {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  icon?: string;
  productCount: number;
}

export default function CategoriesPage() {
  const [search, setSearch] = useState("")
  const [editCategory, setEditCategory] = useState<CategoryDoc | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [industry, setIndustry] = useState("")

  const categories = useCategories()
  const create = createCategory.useMutation()
  const update = updateCategory.useMutation()
  const remove = deleteCategory.useMutation()

  const isLoading = categories === undefined

  const filtered = (categories ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const perPage = 8
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const industries = ["Business", "Technology", "E-commerce", "Design", "Marketing", "Analytics", "SaaS", "Finance", "Creative", "CRM", "Social Media", "HR", "Education"]

  const openNewDialog = () => {
    setEditCategory(null)
    setName("")
    setSlug("")
    setDescription("")
    setIndustry("")
    setDialogOpen(true)
  }

  const openEditDialog = (cat: CategoryDoc) => {
    setEditCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description ?? "")
    setIndustry(cat.industry ?? "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name || !slug) { toast.error("Name and slug are required"); return }
    const payload: CategoryInput = { name, slug, description: description || undefined, industry: industry || undefined }
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return
    try {
      await remove({ id: id as never })
      toast.success("Category deleted")
    } catch (e) {
      toast.error(String(e))
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        description="Manage product categories"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Categories" }]}
        action={<Button onClick={openNewDialog}><Plus className="h-4 w-4" /> Add Category</Button>}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search categories..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardAction><span className="text-sm text-muted-foreground">{filtered.length} categories</span></CardAction>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((cat) => (
                  <TableRow key={cat._id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{cat.slug}</TableCell>
                    <TableCell><Badge variant="outline">{cat.industry ?? "—"}</Badge></TableCell>
                    <TableCell className="text-center">{cat.productCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(cat as CategoryDoc)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDelete(cat._id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <EmptyState icon={<Tags className="h-12 w-12" />} title="No categories found" description="Try adjusting your search." />
            )}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editCategory ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="category-slug" />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={(v) => { if (v) setIndustry(v) }}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSave}>{editCategory ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
