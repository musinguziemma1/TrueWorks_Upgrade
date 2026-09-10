"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  BookOpen,
  Loader2,
  ExternalLink,
  Download,
  Eye,
  Star,
  Upload,
  X,
  FileIcon,
  Copy,
  FileSpreadsheet,
  ArrowRight,
  BarChart3,
  LayoutGrid,
  FileText,
  CheckCircle2,
  Archive,
} from "lucide-react"
import type { Doc } from "@convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { downloadCsv, toCsv } from "@/lib/csv"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  useResources,
  createResource,
  updateResource,
  deleteResource,
  duplicateResource,
  ResourceInput,
  ResourceStatus,
  ResourceType,
  uploadFile,
} from "@/lib/admin-queries"

type ResourceDoc = Doc<"resources">

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

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "archived", label: "Archived" },
] as const

const CATEGORY_COLORS: Record<string, string> = {
  Guide: "text-blue-600",
  Template: "text-violet-600",
  Article: "text-emerald-600",
  Video: "text-rose-600",
  Tool: "text-amber-600",
  Checklist: "text-cyan-600",
  Webinar: "text-indigo-600",
  "Case Study": "text-teal-600",
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default function ResourcesPage() {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [editResource, setEditResource] = useState<ResourceDoc | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [uploading, setUploading] = useState(false)

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
  const [featuredImage, setFeaturedImage] = useState("")
  const [attachments, setAttachments] = useState<
    { name: string; url: string; size: number }[]
  >([])

  const featuredImageInputRef = useRef<HTMLInputElement>(null)
  const attachmentsInputRef = useRef<HTMLInputElement>(null)

  const resources = useResources()
  const create = createResource.useMutation()
  const update = updateResource.useMutation()
  const remove = deleteResource.useMutation()
  const duplicate = duplicateResource.useMutation()
  const doUpload = uploadFile.useAction()

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

  const stats = {
    total: (resources ?? []).length,
    published: (resources ?? []).filter((r) => r.status === "published").length,
    draft: (resources ?? []).filter((r) => r.status === "draft").length,
    featured: (resources ?? []).filter((r) => r.featured).length,
    totalDownloads: (resources ?? []).reduce((sum, r) => sum + (r.downloadCount ?? 0), 0),
  }

  const perPage = 10
  const totalPages = Math.ceil(filtered.length / perPage)
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

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
    setFeaturedImage("")
    setAttachments([])
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
    setFeaturedImage(res.featuredImage ?? "")
    setAttachments(res.attachments ?? [])
    setDialogOpen(true)
  }

  const handleUploadFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const bytes = await file.arrayBuffer()
      const result = await doUpload({
        name: file.name,
        content: bytes,
        contentType: file.type,
        folder: "Resources",
      })
      setFeaturedImage(result.url ?? "")
      toast.success("Image uploaded")
    } catch (err) {
      toast.error(String(err))
    } finally {
      setUploading(false)
      if (featuredImageInputRef.current) featuredImageInputRef.current.value = ""
    }
  }

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const bytes = await file.arrayBuffer()
        const result = await doUpload({
          name: file.name,
          content: bytes,
          contentType: file.type,
          folder: "Resources/Attachments",
        })
        setAttachments((prev) => [
          ...prev,
          { name: file.name, url: result.url ?? "", size: file.size },
        ])
      }
      toast.success("Files uploaded")
    } catch (err) {
      toast.error(String(err))
    } finally {
      setUploading(false)
      if (attachmentsInputRef.current) attachmentsInputRef.current.value = ""
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
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
      featuredImage: featuredImage || undefined,
      attachments,
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

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      await remove({ id: deleteId as never })
      toast.success("Resource deleted")
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      setDuplicatingId(id)
      const newId = await duplicate({ id: id as never })
      toast.success("Duplicated as draft")
      void newId
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDuplicatingId(null)
    }
  }

  const handleExportCsv = () => {
    const csv = toCsv(
      filtered.map((r) => ({
        title: r.title,
        slug: r.slug,
        category: r.category,
        type: r.type,
        status: r.status,
        featured: r.featured ? "yes" : "no",
        tags: r.tags.join("|"),
        downloads: r.downloadCount,
        createdAt: new Date(r.createdAt).toISOString().slice(0, 10),
      }))
    )
    downloadCsv(`resources-${new Date().toISOString().slice(0, 10)}`, csv)
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
        return <BookOpen className="h-3.5 w-3.5" />
      case "video":
        return <Eye className="h-3.5 w-3.5" />
      case "link":
        return <ExternalLink className="h-3.5 w-3.5" />
      case "download":
        return <Download className="h-3.5 w-3.5" />
    }
  }

  const statCards = [
    {
      label: "Total Resources",
      value: stats.total,
      icon: LayoutGrid,
      tint: "text-primary bg-primary/5",
      footnote: "All content items",
    },
    {
      label: "Published",
      value: stats.published,
      icon: CheckCircle2,
      tint: "text-emerald-600 bg-emerald-50/80",
      footnote: "Live on site",
    },
    {
      label: "Drafts",
      value: stats.draft,
      icon: FileText,
      tint: "text-amber-600 bg-amber-50/80",
      footnote: "Work in progress",
    },
    {
      label: "Featured",
      value: stats.featured,
      icon: Star,
      tint: "text-violet-600 bg-violet-50/80",
      footnote: "Highlighted items",
    },
    {
      label: "Downloads",
      value: stats.totalDownloads,
      icon: Download,
      tint: "text-secondary bg-secondary/5",
      footnote: "Across all resources",
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
              <span className="text-white/70">Resources</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Resources
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Manage guides, templates, articles, and other content
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
              <Plus className="h-4 w-4" /> Add Resource
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", s.tint)}>
                  <s.icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
                {isLoading ? (
                  <span className="inline-block h-6 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  s.value
                )}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">{s.footnote}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, description or category..."
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
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatusFilter(f.key)
                setPage(1)
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              {f.key !== "all" && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {f.key === "published"
                    ? stats.published
                    : f.key === "draft"
                      ? stats.draft
                      : (resources ?? []).filter((r) => r.status === "archived").length}
                </span>
              )}
            </button>
          ))}
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            if (v) setCategoryFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder="All Categories" />
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
              <BookOpen className="h-4 w-4" />
            </span>
            <CardTitle>Resources</CardTitle>
          </div>
          <CardAction>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              {filtered.length} {filtered.length === 1 ? "resource" : "resources"}
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
              icon={<BookOpen className="h-12 w-12" />}
              title="No resources found"
              description={
                search || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Create your first resource to get started."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 text-primary">Title</TableHead>
                    <TableHead className="text-primary">Category</TableHead>
                    <TableHead className="text-primary">Type</TableHead>
                    <TableHead className="text-center text-primary">Status</TableHead>
                    <TableHead className="text-center text-primary">Featured</TableHead>
                    <TableHead className="text-center text-primary">Downloads</TableHead>
                    <TableHead className="text-primary">Date</TableHead>
                    <TableHead className="w-24 text-right text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((res) => {
                    const categoryColor =
                      CATEGORY_COLORS[res.category] ?? "text-muted-foreground"
                    return (
                      <TableRow
                        key={res._id}
                        className="group transition-colors hover:bg-muted/40"
                      >
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            {res.featuredImage ? (
                              <Image
                                src={res.featuredImage}
                                alt={res.title}
                                width={40}
                                height={40}
                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                                <BookOpen className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{res.title}</p>
                              <p className="max-w-[300px] truncate text-xs text-muted-foreground">
                                {res.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-sm font-medium", categoryColor)}>
                            {res.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            {typeIcon(res.type)}
                            {res.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              res.status === "published"
                                ? "bg-emerald-50/80 text-emerald-600"
                                : res.status === "draft"
                                  ? "bg-amber-50/80 text-amber-600"
                                  : "bg-muted/50 text-muted-foreground"
                            )}
                          >
                            {res.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {res.featured ? (
                            <Star className="mx-auto h-4 w-4 fill-amber-500 text-amber-500" />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                            {res.downloadCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(res.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleDuplicate(res._id)}
                              disabled={duplicatingId === res._id}
                              title="Duplicate as draft"
                              aria-label={`Duplicate ${res.title}`}
                            >
                              {duplicatingId === res._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => openEditDialog(res)}
                              aria-label={`Edit ${res.title}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteId(res._id)}
                              aria-label={`Delete ${res.title}`}
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
            -{" "}
            <span className="font-medium text-foreground">
              {Math.min(safePage * perPage, filtered.length)}
            </span>{" "}
            of{" "}
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
        title="Delete this resource?"
        description="This permanently removes the resource, its attachments, and any external link. This action cannot be undone."
        confirmLabel="Delete resource"
        destructive
        onConfirm={handleDelete}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editResource ? "Edit Resource" : "New Resource"}
            </DialogTitle>
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
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="resource-slug"
              />
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
                <Select
                  value={category}
                  onValueChange={(v) => {
                    if (v) setCategory(v)
                  }}
                >
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
                <Select
                  value={type}
                  onValueChange={(v) => {
                    if (v) setType(v as ResourceType)
                  }}
                >
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
                <Select
                  value={status}
                  onValueChange={(v) => {
                    if (v) setStatus(v as ResourceStatus)
                  }}
                >
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

            {/* Featured Image Upload */}
            <div className="space-y-2">
              <Label>Featured Image</Label>
              <input
                ref={featuredImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadFeaturedImage}
              />
              {featuredImage ? (
                <div className="relative inline-block h-32 w-48">
                  <Image
                    src={featuredImage}
                    alt="Featured"
                    fill
                    sizes="192px"
                    className="rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage("")}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => featuredImageInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-32 w-48 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface transition-colors hover:border-primary/40 hover:bg-primary/[0.02]"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {uploading ? "Uploading..." : "Click to upload"}
                  </span>
                </button>
              )}
            </div>

            {/* Attachments Upload */}
            <div className="space-y-2">
              <Label>Attachments</Label>
              <input
                ref={attachmentsInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUploadAttachment}
              />
              <button
                type="button"
                onClick={() => attachmentsInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.02]"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading
                    ? "Uploading..."
                    : "Click to upload files (PDF, DOC, XLS, etc.)"}
                </span>
              </button>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2"
                    >
                      <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{att.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editResource ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
