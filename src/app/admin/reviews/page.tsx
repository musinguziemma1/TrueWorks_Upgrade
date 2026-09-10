"use client"

import { useMemo, useState } from "react"
import {
  Search,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  MessageSquare,
  FileSpreadsheet,
  X,
  Loader2,
  ArrowRight,
  BarChart3,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Award,
  TrendingUp,
} from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Doc } from "@convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { downloadCsv, toCsv } from "@/lib/csv"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  useReviews,
  approveReview,
  rejectReview,
  toggleFeaturedReview,
  deleteReview,
} from "@/lib/admin-queries"
import { Stars } from "@/components/product/stars"

type ReviewDoc = Doc<"reviews">

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const

export default function ReviewsPage() {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [previewReview, setPreviewReview] = useState<ReviewDoc | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const reviews = useReviews({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search.trim() || undefined,
  })
  const reviewStats = useQuery(api.reviews.stats)
  const approve = approveReview.useMutation()
  const reject = rejectReview.useMutation()
  const toggleFeatured = toggleFeaturedReview.useMutation()
  const remove = deleteReview.useMutation()

  const isLoading = reviews === undefined
  const filtered = (reviews ?? []) as ReviewDoc[]

  const perPage = 10
  const totalPages = Math.ceil(filtered.length / perPage)
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id)
      await approve({ id: id as never })
      toast.success("Review approved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id)
      await reject({ id: id as never })
      toast.success("Review rejected")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleFeatured = async (id: string) => {
    try {
      setActionLoading(id)
      await toggleFeatured({ id: id as never })
      toast.success("Updated featured status")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      await remove({ id: deleteId as never })
      toast.success("Review deleted")
      setDeleteId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  const handleExportCsv = () => {
    const csv = toCsv(
      filtered.map((r) => ({
        customer: r.customerName,
        rating: r.rating,
        title: r.title ?? "",
        content: r.content,
        status: r.status,
        featured: r.featured ? "yes" : "no",
        verified: r.verified ? "yes" : "no",
        date: new Date(r.createdAt).toISOString().slice(0, 10),
      }))
    )
    downloadCsv(`reviews-${new Date().toISOString().slice(0, 10)}`, csv)
  }

  const stats = [
    {
      label: "Total Reviews",
      value: reviewStats?.total ?? 0,
      icon: MessageSquare,
      tint: "text-primary bg-primary/5",
      footnote: "All customer reviews",
    },
    {
      label: "Pending",
      value: reviewStats?.pending ?? 0,
      icon: Clock,
      tint: "text-amber-600 bg-amber-50/80",
      footnote: "Awaiting moderation",
    },
    {
      label: "Approved",
      value: reviewStats?.approved ?? 0,
      icon: ThumbsUp,
      tint: "text-emerald-600 bg-emerald-50/80",
      footnote: "Published reviews",
    },
    {
      label: "Rejected",
      value: reviewStats?.rejected ?? 0,
      icon: ThumbsDown,
      tint: "text-red-600 bg-red-50/80",
      footnote: "Declined reviews",
    },
    {
      label: "Featured",
      value: reviewStats?.featured ?? 0,
      icon: Award,
      tint: "text-amber-500 bg-amber-50/80",
      footnote: "Highlighted reviews",
    },
    {
      label: "Avg Rating",
      value: reviewStats?.avgRating ?? 0,
      icon: TrendingUp,
      tint: "text-primary bg-primary/5",
      footnote: "Out of 5 stars",
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
              <span className="text-white/70">Reviews</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Customer Reviews
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Manage customer reviews, ratings, and feedback
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
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
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
            placeholder="Search by customer, title or content..."
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
              {f.key !== "all" && reviewStats && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {f.key === "pending"
                    ? reviewStats.pending
                    : f.key === "approved"
                      ? reviewStats.approved
                      : reviewStats.rejected}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
              <Star className="h-4 w-4" />
            </span>
            <CardTitle>Reviews</CardTitle>
          </div>
          <CardAction>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              {filtered.length} {filtered.length === 1 ? "review" : "reviews"}
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
              icon={<MessageSquare className="h-12 w-12" />}
              title="No reviews found"
              description={
                search || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Customer reviews will appear here once submitted."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 text-primary">Customer</TableHead>
                    <TableHead className="text-primary">Rating</TableHead>
                    <TableHead className="text-primary">Review</TableHead>
                    <TableHead className="text-center text-primary">Status</TableHead>
                    <TableHead className="text-primary">Date</TableHead>
                    <TableHead className="w-24 text-right text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((review) => (
                    <TableRow key={review._id} className="group transition-colors hover:bg-muted/40">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/5 text-xs font-semibold text-primary">
                            {review.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{review.customerName}</p>
                            {review.verified && (
                              <span className="text-[10px] text-emerald-600">Verified purchase</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Stars rating={review.rating} starClassName="h-3.5 w-3.5" />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {review.title && (
                            <p className="font-medium text-sm text-foreground">{review.title}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={review.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setPreviewReview(review)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {review.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                                onClick={() => handleApprove(review._id)}
                                disabled={actionLoading === review._id}
                                title="Approve"
                              >
                                {actionLoading === review._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                onClick={() => handleReject(review._id)}
                                disabled={actionLoading === review._id}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 text-muted-foreground",
                              review.featured ? "hover:text-amber-500" : "hover:text-amber-500"
                            )}
                            onClick={() => handleToggleFeatured(review._id)}
                            disabled={actionLoading === review._id}
                            title={review.featured ? "Remove from featured" : "Mark as featured"}
                          >
                            <Star
                              className={cn("h-4 w-4", review.featured && "fill-amber-500 text-amber-500")}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={() => setDeleteId(review._id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* Preview Dialog */}
      <Dialog open={!!previewReview} onOpenChange={() => setPreviewReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {previewReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-sm font-semibold text-primary">
                  {previewReview.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{previewReview.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(previewReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Rating</p>
                <Stars rating={previewReview.rating} starClassName="h-4 w-4" />
              </div>
              {previewReview.title && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Title</p>
                  <p className="font-medium text-foreground">{previewReview.title}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Content</p>
                <p className="whitespace-pre-wrap text-sm text-foreground">{previewReview.content}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <StatusBadge status={previewReview.status} />
                </div>
                {previewReview.featured && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-amber-500" />
                    <span className="text-xs font-medium">Featured</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this review? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
