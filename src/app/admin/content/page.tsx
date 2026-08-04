"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { FileText, Search, Plus, Trash2, Eye, Loader2, X } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Id } from "@convex/_generated/dataModel"

interface ContentItem {
  _id: Id<"pages">
  title: string
  type: string
  status: string
  slug: string
  createdAt: number
}

interface FormData {
  title: string
  slug: string
  content: string
  type: "page" | "post" | "resource"
  excerpt: string
  status: "draft" | "published"
}

const defaultFormData: FormData = {
  title: "",
  slug: "",
  content: "",
  type: "page",
  excerpt: "",
  status: "draft",
}

function ContentTable({ items, label, onDelete, onEdit }: { items: ContentItem[]; label: string; onDelete: (id: Id<"pages">) => void; onEdit: (item: ContentItem) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardAction>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">{items.length} items</span>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title={`No ${label.toLowerCase()} found`}
            description="Create your first content item to get started."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                  <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {item.type === "resource" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View public page"
                          onClick={() => window.open(`/resources/${item.slug}`, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(item)}><FileText className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => onDelete(item._id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default function ContentPage() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [saving, setSaving] = useState(false)

  const allPages = useQuery(api.pages.list, {})
  const deletePage = useMutation(api.pages.remove)
  const createPage = useMutation(api.pages.create)
  const updatePage = useMutation(api.pages.update)

  const filtered = allPages?.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase())) ?? []
  const pages = filtered.filter((c) => c.type === "page")
  const posts = filtered.filter((c) => c.type === "post")
  const resources = filtered.filter((c) => c.type === "resource")

  function handleDelete(id: Id<"pages">) {
    deletePage({ id }).then(() => toast.success("Deleted")).catch(() => toast.error("Failed to delete"))
  }

  function openCreateDialog(type: "page" | "post" | "resource") {
    setEditingItem(null)
    setFormData({ ...defaultFormData, type })
    setDialogOpen(true)
  }

  function openEditDialog(item: ContentItem) {
    setEditingItem(item)
    setFormData({
      title: item.title,
      slug: item.slug,
      content: "",
      type: item.type as "page" | "post" | "resource",
      excerpt: "",
      status: item.status as "draft" | "published",
    })
    setDialogOpen(true)
  }

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }
    setSaving(true)
    try {
      const slug = formData.slug.trim() || generateSlug(formData.title)
      if (editingItem) {
        await updatePage({
          id: editingItem._id,
          title: formData.title,
          slug,
          content: formData.content,
          type: formData.type,
          excerpt: formData.excerpt || undefined,
          status: formData.status,
        })
        toast.success("Content updated")
      } else {
        await createPage({
          title: formData.title,
          slug,
          content: formData.content || " ",
          type: formData.type,
          excerpt: formData.excerpt || undefined,
          status: formData.status,
        })
        toast.success("Content created")
      }
      setDialogOpen(false)
      setFormData(defaultFormData)
      setEditingItem(null)
    } catch {
      toast.error("Failed to save content")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Content"
        description="Manage pages, posts, and resources"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Content" }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search content..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openCreateDialog("page")}><Plus className="h-4 w-4 mr-1" /> Page</Button>
          <Button variant="outline" size="sm" onClick={() => openCreateDialog("post")}><Plus className="h-4 w-4 mr-1" /> Post</Button>
          <Button size="sm" onClick={() => openCreateDialog("resource")}><Plus className="h-4 w-4 mr-1" /> Resource</Button>
        </div>
      </div>

      {allPages === undefined ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="pages">
          <TabsList>
            <TabsTrigger value="pages">Pages ({pages.length})</TabsTrigger>
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            <TabsContent value="pages"><ContentTable items={pages} label="Pages" onDelete={handleDelete} onEdit={openEditDialog} /></TabsContent>
            <TabsContent value="posts"><ContentTable items={posts} label="Posts" onDelete={handleDelete} onEdit={openEditDialog} /></TabsContent>
            <TabsContent value="resources"><ContentTable items={resources} label="Resources" onDelete={handleDelete} onEdit={openEditDialog} /></TabsContent>
          </div>
        </Tabs>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Content" : "New Content"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Content title" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input placeholder="auto-generated from title" value={formData.slug} onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => { if (v) setFormData((p) => ({ ...p, type: v as FormData["type"] })) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => { if (v) setFormData((p) => ({ ...p, status: v as FormData["status"] })) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Input placeholder="Short description (optional)" value={formData.excerpt} onChange={(e) => setFormData((p) => ({ ...p, excerpt: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea placeholder="Write your content here..." className="min-h-[200px]" value={formData.content} onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
