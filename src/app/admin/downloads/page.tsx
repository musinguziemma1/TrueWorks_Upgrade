"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Doc } from "@convex/_generated/dataModel"
import {
  Search,
  RefreshCw,
  Shield,
  FileDown,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Activity,
  X,
  ArrowRight,
  BarChart3,
  Clock,
  Ban,
  Download as DownloadIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { downloadCsv, toCsv } from "@/lib/csv"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
  { key: "disabled", label: "Disabled" },
] as const

export default function DownloadsPage() {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState("all")
  const [confirmAction, setConfirmAction] = useState<{
    id: Doc<"downloads">["_id"]
    type: "reset" | "revoke"
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const downloads = useQuery(api.downloads.listAll, {
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  })
  const downloadStats = useQuery(api.downloads.stats)
  const resetLimit = useMutation(api.downloads.resetLimit)
  const revoke = useMutation(api.downloads.revoke)

  function expiryStatus(expiresAt: number) {
    if (expiresAt < Date.now()) return "Expired"
    return "Active"
  }

  const handleReset = async () => {
    if (!confirmAction) return
    try {
      setActionLoading(true)
      await resetLimit({ id: confirmAction.id })
      toast.success("Limit reset")
    } catch (e) {
      toast.error(String(e))
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  const handleRevoke = async () => {
    if (!confirmAction) return
    try {
      setActionLoading(true)
      await revoke({ id: confirmAction.id })
      toast.success("Download revoked")
    } catch (e) {
      toast.error(String(e))
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  const handleExportCsv = () => {
    const csv = toCsv(
      (downloads ?? []).map((d) => ({
        product: d.productName,
        email: d.email,
        downloads: d.downloadCount,
        remaining: d.remainingDownloads,
        expires: new Date(d.expiresAt).toISOString().slice(0, 10),
        status: expiryStatus(d.expiresAt) === "Expired" ? "expired" : d.status,
        device: d.device ?? "",
        ip: d.ipAddress ?? "",
      }))
    )
    downloadCsv(`downloads-${new Date().toISOString().slice(0, 10)}`, csv)
  }

  const isLoading = downloads === undefined

  const stats = [
    {
      label: "Total Records",
      value: downloadStats?.total ?? 0,
      icon: FileDown,
      tint: "text-primary bg-primary/5",
      footnote: "All download entries",
    },
    {
      label: "Active",
      value: downloadStats?.active ?? 0,
      icon: CheckCircle2,
      tint: "text-emerald-600 bg-emerald-50/80",
      footnote: "Valid downloads",
    },
    {
      label: "Expired",
      value: downloadStats?.expired ?? 0,
      icon: Clock,
      tint: "text-amber-600 bg-amber-50/80",
      footnote: "Past expiry date",
    },
    {
      label: "Disabled",
      value: downloadStats?.disabled ?? 0,
      icon: Ban,
      tint: "text-red-600 bg-red-50/80",
      footnote: "Revoked access",
    },
    {
      label: "Total Downloads",
      value: downloadStats?.totalDownloads ?? 0,
      icon: Activity,
      tint: "text-secondary bg-secondary/5",
      footnote: "Across all records",
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
              <span className="text-white/70">Downloads</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Download Manager
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Manage digital product downloads and access permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={handleExportCsv}
              disabled={downloads?.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
            placeholder="Search by product or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 pl-10 pr-9"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
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
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              {f.key !== "all" && downloadStats && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {f.key === "active"
                    ? downloadStats.active
                    : f.key === "expired"
                      ? downloadStats.expired
                      : downloadStats.disabled}
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
              <DownloadIcon className="h-4 w-4" />
            </span>
            <CardTitle>Download Records</CardTitle>
          </div>
          <CardAction>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              {downloads?.length ?? 0} records
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : downloads.length === 0 ? (
            <EmptyState
              icon={<FileDown className="h-12 w-12" />}
              title="No download records"
              description={
                search || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "No downloads have been recorded yet."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 text-primary">Product</TableHead>
                    <TableHead className="text-primary">Customer</TableHead>
                    <TableHead className="text-center text-primary">Downloads</TableHead>
                    <TableHead className="text-center text-primary">Remaining</TableHead>
                    <TableHead className="text-primary">Expiry</TableHead>
                    <TableHead className="text-primary">Device</TableHead>
                    <TableHead className="text-primary">IP</TableHead>
                    <TableHead className="text-center text-primary">Status</TableHead>
                    <TableHead className="w-20 text-right text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downloads.map((d) => {
                    const isExpired = expiryStatus(d.expiresAt) === "Expired"
                    return (
                      <TableRow key={d._id} className="group transition-colors hover:bg-muted/40">
                        <TableCell className="pl-4">
                          <span className="font-medium text-foreground">{d.productName}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{d.email}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                            {d.downloadCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                              d.remainingDownloads > 0
                                ? "bg-emerald-50/80 text-emerald-600"
                                : "bg-red-50/80 text-red-600"
                            )}
                          >
                            {d.remainingDownloads}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "text-sm",
                              isExpired ? "text-red-600" : "text-muted-foreground"
                            )}
                          >
                            {new Date(d.expiresAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{d.device ?? "—"}</span>
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs text-muted-foreground">
                            {d.ipAddress ?? "—"}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge
                            status={isExpired ? "Expired" : d.status}
                          />
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="Reset download limit"
                              onClick={() =>
                                setConfirmAction({ id: d._id, type: "reset" })
                              }
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Revoke access"
                              onClick={() =>
                                setConfirmAction({ id: d._id, type: "revoke" })
                              }
                            >
                              <Shield className="h-4 w-4" />
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

      {/* Confirm Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open && !actionLoading) setConfirmAction(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "reset"
                ? "Reset download limit?"
                : "Revoke download?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmAction?.type === "reset"
              ? "This will reset the customer's download limit so they can download the product again."
              : "This will permanently revoke this customer's access to the download. This action cannot be undone."}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction?.type === "revoke" ? "destructive" : "default"}
              onClick={confirmAction?.type === "reset" ? handleReset : handleRevoke}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction?.type === "reset" ? "Reset Limit" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
