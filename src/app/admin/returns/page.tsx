"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Mail,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysLeft(deadline: number) {
  const ms = deadline - Date.now();
  if (ms <= 0) return null;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function refundTotal(row: ReturnRow): number {
  return row.items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
}

type ReturnRow = Doc<"returns"> & {
  orderCreatedAt: number;
  refundDeadline: number;
  windowExpired: boolean;
};

export default function AdminReturnsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "")
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all")
  const [selected, setSelected] = useState<ReturnRow | null>(null);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");
  const [confirmDecision, setConfirmDecision] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [offset, setOffset] = useState(0);

  // Keep URL in sync so views are shareable + refresh-safe.
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const qs = params.toString();
    router.replace(qs ? `/admin/returns?${qs}` : "/admin/returns", { scroll: false });
  }, [search, statusFilter, router]);

  const PAGE_SIZE = 20;

  const pageData = useQuery(api.returns.adminListPage, {
    search: search.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: PAGE_SIZE,
    offset,
  });
  const rows = (pageData?.page ?? []) as ReturnRow[];
  const totalCount = pageData?.total ?? 0;
  const isInitialLoading = pageData === undefined;
  const canLoadMore = rows.length < totalCount;
  const review = useMutation(api.returns.review);

  const returnStats = useQuery(api.returns.adminStats);
  const stats = {
    total: returnStats?.total ?? 0,
    pending: returnStats?.pending ?? 0,
    approved: returnStats?.approved ?? 0,
    completed: returnStats?.completed ?? 0,
    rejected: returnStats?.rejected ?? 0,
    pendingValue: returnStats?.pendingValue ?? 0,
  };

  const handleReview = async () => {
    if (!decisionId) return;
    try {
      setSubmitting(true);
      await review({
        id: decisionId as never,
        decision,
        adminNotes: adminNotes.trim() || undefined,
      });
      toast.success(decision === "approve" ? "Refund approved" : "Refund request rejected");
      setConfirmDecision(false);
      setDecisionId(null);
      setAdminNotes("");
      setDecision("approve");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update return request");
    } finally {
      setSubmitting(false);
    }
  };

  const decisionTarget = decisionId ? rows.find((r) => r._id === (decisionId as never)) : null;

  const handleExportCsv = () => {
    const csv = toCsv(
      rows.map((r) => ({
        order: r.orderNumber,
        customer: r.customerName,
        email: r.customerEmail,
        items: r.items.map((i) => i.productName).join("; "),
        amount: refundTotal(r),
        status: r.status,
        requested: fmtDate(r.createdAt),
        deadline: fmtDate(r.refundDeadline),
        expired: r.windowExpired ? "yes" : "no",
      }))
    );
    downloadCsv(`refund-requests-${new Date().toISOString().slice(0, 10)}`, csv);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Refund Requests"
        description="Review and approve or reject customer refund requests. Approving refunds money to the original payment method and revokes access to the order."
        breadcrumbs={[{ label: "Data" }, { label: "Refunds", href: "/admin/returns" }]}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            className="gap-2 border-[#0B2545]/30 text-[#0B2545] hover:bg-[#0B2545]/5"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-amber-600" },
          { label: "Approved", value: stats.approved, color: "text-green-600" },
          { label: "Completed", value: stats.completed, color: "text-muted-foreground" },
          { label: "Rejected", value: stats.rejected, color: "text-red-600" },
          { label: "Pending Value", value: fmtMoney(stats.pendingValue), color: "text-[#0B2545]" },
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
            <CardTitle>All Requests</CardTitle>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Search by order, email, customer..."
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); setOffset(0); }}
                  className="pl-9 md:w-72"
                  aria-label="Search refund requests"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setOffset(0); }}>
                <SelectTrigger className="w-40" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isInitialLoading ? (
            <div className="py-12 text-center text-muted">Loading refund requests...</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<RotateCcw className="h-12 w-12" />}
              title="No refund requests"
              description={
                search
                  ? "Try adjusting your search"
                  : "Customer refund requests will appear here"
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const left = daysLeft(r.refundDeadline);
                  return (
                    <TableRow key={r._id}>
                      <TableCell>
                        <button
                          onClick={() => setSelected(r)}
                          className="text-left font-medium text-primary hover:underline"
                        >
                          {r.orderNumber}
                        </button>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{r.customerName}</p>
                        <p className="text-xs text-muted flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {r.customerEmail}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted">
                        {r.items.map((i) => i.productName).join(", ")}
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {fmtMoney(refundTotal(r))}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell>
                        {r.windowExpired ? (
                          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        ) : left !== null ? (
                          left <= 1 ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {left} day{left === 1 ? "" : "s"} left
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted">
                              {left} day{left === 1 ? "" : "s"} left · {fmtDate(r.refundDeadline)}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-muted">{fmtDate(r.refundDeadline)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(r)}
                            aria-label={`View details for ${r.orderNumber}`}
                          >
                            Details
                          </Button>
                          {r.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={r.windowExpired}
                                onClick={() => {
                                  setDecisionId(r._id);
                                  setDecision("approve");
                                  setAdminNotes("");
                                }}
                                className="text-green-600 hover:text-green-700"
                                aria-label={`Approve refund for ${r.orderNumber}`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDecisionId(r._id);
                                  setDecision("reject");
                                  setAdminNotes("");
                                }}
                                className="text-red-600 hover:text-red-700"
                                aria-label={`Reject refund for ${r.orderNumber}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {canLoadMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                >
                  Load more ({Math.min(PAGE_SIZE, totalCount - rows.length)})
                </Button>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refund Request — {selected?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={selected.status} />
                {selected.windowExpired ? (
                  <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                    Refund window expired
                  </Badge>
                ) : (
                  <span className="text-xs text-muted">
                    Placed {fmtDate(selected.orderCreatedAt)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-muted">Customer</p>
                <p className="font-medium">{selected.customerName}</p>
                <p className="text-sm text-muted">{selected.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Items</p>
                <div className="space-y-1">
                  {selected.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between rounded-md border border-border/70 bg-surface px-3 py-2 text-sm"
                    >
                      <span>{item.productName}</span>
                      <span className="text-muted">
                        {item.quantity} × {fmtMoney(item.price)}
                        {item.reason ? (
                          <span className="block text-xs text-muted-foreground">{item.reason}</span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {selected.notes && (
                <div>
                  <p className="text-sm text-muted">Customer notes</p>
                  <p className="text-sm whitespace-pre-wrap">{selected.notes}</p>
                </div>
              )}
              {selected.adminNotes && (
                <div>
                  <p className="text-sm text-muted">Admin notes</p>
                  <p className="text-sm whitespace-pre-wrap">{selected.adminNotes}</p>
                </div>
              )}
              {selected.providerResult && (
                <div>
                  <p className="text-sm text-muted">Refund result</p>
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {selected.providerResult}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted mb-2">Timeline</p>
                <div className="space-y-3">
                  {(() => {
                    const steps: { label: string; time: number }[] = [
                      { label: "Order placed", time: selected.orderCreatedAt },
                      { label: "Refund requested", time: selected.createdAt },
                    ]
                    if (selected.approvedAt) steps.push({ label: "Approved", time: selected.approvedAt })
                    if (selected.refundedAt) steps.push({ label: "Refunded", time: selected.refundedAt })
                    return steps.map((step, i) => (
                      <div key={step.label} className="flex items-start gap-3">
                        <div className="mt-1.5 flex flex-col items-center">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              i === steps.length - 1
                                ? selected?.status === "completed"
                                  ? "bg-green-500"
                                  : selected?.status === "rejected"
                                    ? "bg-red-500"
                                    : "bg-amber-500"
                                : "bg-[#0B2545]/40"
                            }`}
                          />
                          {i < steps.length - 1 && <span className="w-px flex-1 bg-border" />}
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-medium">{step.label}</p>
                          <p className="text-xs text-muted">{fmtDate(step.time)}</p>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decision Dialog (collects notes) */}
      <Dialog
        open={!!decisionId && !confirmDecision}
        onOpenChange={(open) => { if (!open) setDecisionId(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "approve" ? "Approve Refund" : "Reject Refund Request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {decisionTarget ? (
              <p className="text-sm bg-surface border border-border rounded-md px-3 py-2">
                <span className="text-muted">Refund amount: </span>
                <span className="font-semibold text-foreground">{fmtMoney(refundTotal(decisionTarget))}</span>
              </p>
            ) : null}
            <p className="text-sm text-muted">
              {decision === "approve"
                ? "Approving will refund the money to the original payment method (where supported), revoke access to the order, and roll back sales and customer stats."
                : "The customer will be notified that their refund request was not approved."}
            </p>
            <textarea
              placeholder="Admin notes (visible in audit log and to the customer)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Admin notes"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionId(null)}>
              Cancel
            </Button>
            <Button
              variant={decision === "approve" ? "default" : "destructive"}
              onClick={() => setConfirmDecision(true)}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final confirmation */}
      <ConfirmDialog
        open={confirmDecision}
        onOpenChange={(open) => { if (!open && !submitting) { setConfirmDecision(false); setDecisionId(null) } }}
        title={decision === "approve" ? "Confirm refund approval" : "Confirm refund rejection"}
        description={
          decision === "approve"
            ? `Refund ${decisionTarget ? fmtMoney(refundTotal(decisionTarget)) : ""} will be issued to the original payment method. This rolls back sales stats and revokes order access.`
            : "The customer will be notified that their refund was not approved. You can add additional notes on the next screen."
        }
        confirmLabel={decision === "approve" ? "Approve & Refund" : "Reject Request"}
        destructive={decision === "reject"}
        onConfirm={handleReview}
      />
    </div>
  );
}
