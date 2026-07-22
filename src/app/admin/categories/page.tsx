"use client"

import { useState } from "react"
import { Plus, Edit3, Trash2, Search, Tags } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Category {
  id: string; name: string; slug: string; industry: string; products: number
}

const initialCategories: Category[] = [
  { id: "1", name: "Templates", slug: "templates", industry: "Business", products: 24 },
  { id: "2", name: "Dashboards", slug: "dashboards", industry: "Technology", products: 18 },
  { id: "3", name: "Bundles", slug: "bundles", industry: "E-commerce", products: 12 },
  { id: "4", name: "Components", slug: "components", industry: "Design", products: 30 },
  { id: "5", name: "Marketing", slug: "marketing", industry: "Marketing", products: 15 },
  { id: "6", name: "Tools", slug: "tools", industry: "Finance", products: 9 },
  { id: "7", name: "Software", slug: "software", industry: "CRM", products: 6 },
  { id: "8", name: "E-books", slug: "ebooks", industry: "Education", products: 4 },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState(initialCategories)
  const [search, setSearch] = useState("")
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleDelete = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        description="Manage product categories"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Categories" }]}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button><Plus className="h-4 w-4" /> Add Category</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editCategory ? "Edit Category" : "New Category"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input defaultValue={editCategory?.name} placeholder="Category name" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input defaultValue={editCategory?.slug} placeholder="category-slug" />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select defaultValue={editCategory?.industry}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {["Business", "Technology", "E-commerce", "Design", "Marketing", "Finance", "CRM", "Education"].map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter showCloseButton>
                <Button onClick={() => setDialogOpen(false)}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search categories..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} categories found</span>
          </CardAction>
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
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{cat.slug}</TableCell>
                  <TableCell><Badge variant="outline">{cat.industry}</Badge></TableCell>
                  <TableCell className="text-center">{cat.products}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm"
                        onClick={() => { setEditCategory(cat); setDialogOpen(true) }}
                      ><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive"
                        onClick={() => handleDelete(cat.id)}
                      ><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<Tags className="h-12 w-12" />}
              title="No categories found"
              description="Try adjusting your search to find what you're looking for."
            />
          )}
        </CardContent>
      </Card>

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
