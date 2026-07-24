"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Search, RefreshCw, Clock, Shield, Link, FileDown, Loader2 } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function DownloadsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const downloads = useQuery(api.downloads.listAll, {
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  })
  const resetLimit = useMutation(api.downloads.resetLimit)
  const revoke = useMutation(api.downloads.revoke)

  function expiryStatus(expiresAt: number) {
    if (expiresAt < Date.now()) return "Expired"
    return "Active"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Downloads"
        description="Manage digital product downloads"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Downloads" }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by product or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                        <Button variant="ghost" size="icon-sm" title="Reset limit" onClick={() => resetLimit({ id: d._id }).then(() => toast.success("Limit reset"))}><RefreshCw className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon-sm" title="Revoke" onClick={() => revoke({ id: d._id }).then(() => toast.success("Download revoked"))}><Shield className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
