"use client"

import { useState } from "react"
import { Search, RefreshCw, Clock, Shield, Link, FileDown } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DownloadRecord {
  id: string; product: string; customer: string; count: number; remaining: number
  expiry: string; device: string; ip: string; status: "Active" | "Expired" | "Disabled"
}

const downloads: DownloadRecord[] = [
  { id: "1", product: "Business Template Pro", customer: "Sarah Mbabazi", count: 3, remaining: 2, expiry: "2026-08-20", device: "Chrome/Win", ip: "192.168.1.1", status: "Active" },
  { id: "2", product: "Admin Dashboard Kit", customer: "John Okello", count: 1, remaining: 4, expiry: "2026-08-19", device: "Safari/macOS", ip: "192.168.1.2", status: "Active" },
  { id: "3", product: "UI Component Pack", customer: "Grace Nabatanzi", count: 5, remaining: 0, expiry: "2026-07-19", device: "Chrome/Android", ip: "192.168.1.3", status: "Expired" },
  { id: "4", product: "E-commerce Bundle", customer: "David Kato", count: 2, remaining: 3, expiry: "2026-08-18", device: "Firefox/Win", ip: "192.168.1.4", status: "Active" },
  { id: "5", product: "Marketing Suite", customer: "Alice Muhwezi", count: 0, remaining: 5, expiry: "2026-08-17", device: "-", ip: "-", status: "Active" },
  { id: "6", product: "Analytics Dashboard", customer: "Peter Ssempijja", count: 4, remaining: 1, expiry: "2026-08-16", device: "Chrome/Win", ip: "192.168.1.5", status: "Disabled" },
  { id: "7", product: "SaaS Landing Page", customer: "Susan Nalwoga", count: 2, remaining: 3, expiry: "2026-08-15", device: "Safari/iOS", ip: "192.168.1.6", status: "Active" },
  { id: "8", product: "Invoice Generator", customer: "Robert Mugisha", count: 6, remaining: 0, expiry: "2026-07-15", device: "Chrome/Win", ip: "192.168.1.7", status: "Expired" },
]

export default function DownloadsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = downloads.filter((d) => {
    if (search && !d.product.toLowerCase().includes(search.toLowerCase()) && !d.customer.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== "All" && d.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

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
          <Input placeholder="Search by product or customer..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1) } }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Active", "Expired", "Disabled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Download Records</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} records found</span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
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
              {paginated.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.product}</TableCell>
                  <TableCell>{d.customer}</TableCell>
                  <TableCell className="text-center">{d.count}</TableCell>
                  <TableCell className="text-center">{d.remaining}</TableCell>
                  <TableCell className="text-muted-foreground">{d.expiry}</TableCell>
                  <TableCell className="text-muted-foreground">{d.device}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{d.ip}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={d.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" title="Reset"><RefreshCw className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-sm" title="Extend"><Clock className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-sm" title="Disable"><Shield className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-sm" title="Generate New Link"><Link className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<FileDown className="h-12 w-12" />}
              title="No download records found"
              description="Try adjusting your search or filters to find what you're looking for."
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
