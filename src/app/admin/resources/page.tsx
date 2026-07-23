"use client"

import { useState } from "react"
import { Plus, Edit3, Trash2, Search, BookOpen, Loader2, ExternalLink, Download, Eye, Star } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  useResources,
  createResource,
  updateResource,
  deleteResource,
  ResourceInput,
  ResourceStatus,
  ResourceType,
} from "@/lib/admin-queries"

interface ResourceDoc {
  _id: string
  title: string
  slug: string
  description: string
  content: string
  category: string
  type: ResourceType
  status: ResourceStatus
  featured: boolean
  externalUrl?: string
  thumbnail?: string
  tags: string[]
  downloadCount: number
  createdAt: number
  updatedAt: number
}

const resourceCategories = [
  "Guide",
  "Template",
  "Article",
  "Video",
  "Tool",
  "Checklist",
  "Webinar",
  "Case Study",
]

const resourceTypes: { value: ResourceType; label: string }[] = [
  { value: "document", label: "Document" },
  { value: "video", label: "Video" },
  { value: "link", label: "External Link" },
  { value: "download", label: "Downloadable File" },
]

const statusOptions: { value: ResourceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" })
}

export default function ResourcesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [editResource, setEditResource] = useState<ResourceDoc | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Form fields
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [type, setType] = useState<ResourceType>("document")
  const [status, setStatus] = useState<ResourceStatus>("draft")
  const [featured, setFeatured] = useState(false)
  const [externalUrl, setExternalUrl] = useState("")
  const [tags, setTags] = useState("")

  const resources = useResources()
  const create = createResource.useMutation()
  const update = updateResource.useMutation()
  const remove = deleteResource.useMutation()

  const isLoading = resources === undefined

  const filtered = (resources ?? []).filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const perPage = 10
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const resetForm = () => {
    setTitle("")
    setSlug("")
    setDescription("")
    setContent("")
    setCategory("")
    setType("document")
    setStatus("draft")
    setFeatured(false)
    setExternalUrl("")
    setTags("")
  }

  const openNewDialog = () => {
    setEditResource(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (res: ResourceDoc) => {
    setEditResource(res)
    setTitle(res.title)
    setSlug(res.slug)
    setDescription(res.description)
    setContent(res.content)
    setCategory(res.category)
    setType(res.type)
    setStatus(res.status)
    setFeatured(res.featured)
    setExternalUrl(res.externalUrl ?? "")
    setTags(res.tags.join(", "))
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!title || !slug || !description || !category) {
      toast.error("Title, slug, description, and category are required")
      return
    }
    const payload: ResourceInput = {
      title,
      slug,
      description,
      content,
      category,
      type,
      status,
      featured,
      externalUrl: externalUrl || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }
    try {
      if (editResource) {
        await update({ id: editResource._id as never, ...payload } as never)
        toast.success("Resource updated")
      } else {
        await create(payload as never)
        toast.success("Resource created")
      }
      setDialogOpen(false)
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return
    try {
      await remove({ id: id as never })
      toast.success("Resource deleted")
    } catch (e) {
      toast.error(String(e))
    }
  }

  const autoSlug = (value: string) => {
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    )
  }

  const typeIcon = (t: ResourceType) => {
    switch (t) {
      case "document":
        return <BookOpen className="h-4 w-4" />
      case "video":
        return <Eye className="h-4 w-4" />
      case "link":
        return <ExternalLink className="h-4 w-4" />
      case "download":
        return <Download className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Resources"
        description="Manage guides, templates, articles, and other resources"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Resources" }]}
        action={
          <Button onClick={openNewDialog}>
            <Plus className="h-4 w-4" /> Add Resource
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            if (v) setStatusFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            if (v) setCategoryFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {resourceCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardAction>
              <span className="text-sm text-muted-foreground">{filtered.length} resources</span>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead className="text-center">Downloads</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((res) => (
                  <TableRow key={res._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{res.title}</p>
                        <p className="max-w-[300px] truncate text-xs text-muted-foreground">{res.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{res.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {typeIcon(res.type)}
                        {res.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          res.status === "published"
                            ? "default"
                            : res.status === "draft"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {res.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {res.featured ? (
                        <Star className="mx-auto h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{res.downloadCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(res.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(res)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          onClick={() => handleDelete(res._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <EmptyState
                icon={<BookOpen className="h-12 w-12" />}
                title="No resources found"
                description="Create your first resource or adjust your filters."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editResource ? "Edit Resource" : "New Resource"}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-4 pr-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (!editResource) autoSlug(e.target.value)
                }}
                placeholder="Resource title"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="resource-slug" />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Full content or body text"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={(v) => { if (v) setCategory(v) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={type} onValueChange={(v) => { if (v) setType(v as ResourceType) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => { if (v) setStatus(v as ResourceStatus) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma-separated tags"
                />
              </div>
            </div>
            {(type === "link" || type === "download") && (
              <div className="space-y-2">
                <Label>{type === "link" ? "External URL" : "Download URL"}</Label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured resource
              </Label>
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSave}>{editResource ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
