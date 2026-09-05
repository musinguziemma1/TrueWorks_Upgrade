"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Doc } from "@convex/_generated/dataModel"
import { Search, RefreshCw, Shield, FileDown, Loader2, FileSpreadsheet, CheckCircle2, XCircle, Activity } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { downloadCsv, toCsv } from "@/lib/csv"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"

export default function DownloadsPage() {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState("all")
  const [confirmAction, setConfirmAction] = useState<{ id: Doc<"downloads">["_id"]; type: "reset" | "revoke" } | null>(null)
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
      await resetLimit({ id: confirmAction.id })
      toast.success("Limit reset")
    } catch (e) {
      toast.error(String(e))
    }
    setConfirmAction(null)
  }

  const handleRevoke = async () => {
    if (!confirmAction) return
    try {
      await revoke({ id: confirmAction.id })
      toast.success("Download revoked")
    } catch (e) {
      toast.error(String(e))
    }
    setConfirmAction(null)
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Downloads"
        description="Manage digital product downloads"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Downloads" }]}
        action={
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={downloads?.length === 0}>
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Total Records", value: downloadStats?.total ?? 0, icon: FileDown, color: "text-[#0B2545]" },
          { label: "Active", value: downloadStats?.active ?? 0, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Expired", value: downloadStats?.expired ?? 0, icon: XCircle, color: "text-muted-foreground" },
          { label: "Disabled", value: downloadStats?.disabled ?? 0, icon: Shield, color: "text-red-600" },
          { label: "Total Downloads", value: downloadStats?.totalDownloads ?? 0, icon: Activity, color: "text-[#3E6990]" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by product or email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["all", "active", "expired", "disabled"].map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Download Records</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{downloads?.length ?? 0} records</span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {downloads === undefined ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : downloads.length === 0 ? (
            <EmptyState
              icon={<FileDown className="h-12 w-12" />}
              title="No download records"
              description="No downloads have been recorded yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Downloads</TableHead>
                  <TableHead className="text-center">Remaining</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downloads.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell className="font-medium">{d.productName}</TableCell>
                    <TableCell>{d.email}</TableCell>
                    <TableCell className="text-center">{d.downloadCount}</TableCell>
                    <TableCell className="text-center">{d.remainingDownloads}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(d.expiresAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">{d.device ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{d.ipAddress ?? "—"}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={expiryStatus(d.expiresAt) === "Expired" ? "Expired" : d.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="Reset limit" onClick={() => setConfirmAction({ id: d._id, type: "reset" })}><RefreshCw className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon-sm" title="Revoke" onClick={() => setConfirmAction({ id: d._id, type: "revoke" })}><Shield className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "reset" ? "Reset download limit?" : "Revoke download?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">
            {confirmAction?.type === "reset"
              ? "This will reset the customer's download limit so they can download the product again."
              : "This will permanently revoke this customer's access to the download."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.type === "revoke" ? "destructive" : "default"}
              onClick={confirmAction?.type === "reset" ? handleReset : handleRevoke}
            >
              {confirmAction?.type === "reset" ? "Reset Limit" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
