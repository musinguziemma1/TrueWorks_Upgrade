"use client";

import React, { useState } from "react";
import {
  Search,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  MessageSquare,
  FileSpreadsheet,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { downloadCsv, toCsv } from "@/lib/csv";
import { toast } from "sonner";
import {
  useReviews,
  approveReview,
  rejectReview,
  toggleFeaturedReview,
  deleteReview,
} from "@/lib/admin-queries";
import { Stars } from "@/components/product/stars";

type ReviewDoc = Doc<"reviews">;

export default function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [previewReview, setPreviewReview] = useState<ReviewDoc | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const reviews = useReviews({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search.trim() || undefined,
  });
  const reviewStats = useQuery(api.reviews.stats);
  const approve = approveReview.useMutation();
  const reject = rejectReview.useMutation();
  const toggleFeatured = toggleFeaturedReview.useMutation();
  const remove = deleteReview.useMutation();

  const isLoading = reviews === undefined;

  const filtered = (reviews ?? []) as ReviewDoc[];

  const perPage = 10;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleApprove = async (id: string) => {
    try {
      await approve({ id: id as never });
      toast.success("Review approved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reject({ id: id as never });
      toast.success("Review rejected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject");
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      await toggleFeatured({ id: id as never });
      toast.success("Updated featured status");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove({ id: deleteId as never });
      toast.success("Review deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

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
    );
    downloadCsv(`reviews-${new Date().toISOString().slice(0, 10)}`, csv);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reviews"
        description="Manage customer reviews and ratings"
        action={
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        {[
          { label: "Total", value: reviewStats?.total ?? 0, color: "text-foreground" },
          { label: "Pending", value: reviewStats?.pending ?? 0, color: "text-yellow-600" },
          { label: "Approved", value: reviewStats?.approved ?? 0, color: "text-green-600" },
          { label: "Rejected", value: reviewStats?.rejected ?? 0, color: "text-red-600" },
          { label: "Featured", value: reviewStats?.featured ?? 0, color: "text-amber-500" },
          { label: "Avg Rating", value: reviewStats?.avgRating ?? 0, color: "text-[#0B2545]" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Reviews</CardTitle>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Search reviews..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 md:w-64"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as string);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted">Loading reviews...</div>
          ) : paginated.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-12 w-12" />}
              title="No reviews found"
              description={
                search
                  ? "Try adjusting your search"
                  : "Customer reviews will appear here"
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((review) => (
                    <TableRow key={review._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{review.customerName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Stars rating={review.rating} />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {review.title && (
                            <p className="font-medium text-sm">{review.title}</p>
                          )}
                          <p className="text-sm text-muted line-clamp-2">
                            {review.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={review.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewReview(review)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {review.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(review._id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(review._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFeatured(review._id)}
                            className={review.featured ? "text-yellow-500" : ""}
                          >
                            <Star
                              className={`h-4 w-4 ${review.featured ? "fill-yellow-500" : ""}`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(review._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted">
                    Showing {(page - 1) * perPage + 1}-
                    {Math.min(page * perPage, filtered.length)} of{" "}
                    {filtered.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewReview}
        onOpenChange={() => setPreviewReview(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {previewReview && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Customer</p>
                <p className="font-medium">{previewReview.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Rating</p>
                <Stars rating={previewReview.rating} starClassName="h-4 w-4" />
              </div>
              {previewReview.title && (
                <div>
                  <p className="text-sm text-muted">Title</p>
                  <p className="font-medium">{previewReview.title}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted">Content</p>
                <p className="whitespace-pre-wrap">{previewReview.content}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted">Status</p>
                  <StatusBadge status={previewReview.status} />
                </div>
                <div>
                  <p className="text-sm text-muted">Date</p>
                  <p className="text-sm">
                    {new Date(previewReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">
            Are you sure you want to delete this review? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
