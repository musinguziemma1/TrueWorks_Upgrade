"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Wallet, Search, CreditCard, Loader2 } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPrice } from "@/lib/utils"

export default function PaymentsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(1)
  const perPage = 8

  const payments = useQuery(api.payments.list, {
    status: statusFilter !== "All" ? statusFilter.toLowerCase() : undefined,
    search: search || undefined,
  })

  const isLoading = payments === undefined
  const allPayments = payments ?? []

  const filtered = allPayments.filter((p) => {
    if (search && !p.paymentId.toLowerCase().includes(search.toLowerCase()) && !p.customerName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const stats = {
    total: allPayments.reduce((s, p) => s + p.amount, 0),
    completed: allPayments.filter((p) => p.status === "completed").length,
    failed: allPayments.filter((p) => p.status === "failed").length,
    pending: allPayments.filter((p) => p.status === "pending").length,
    refunded: allPayments.filter((p) => p.status === "refunded").length,
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        description="Monitor and manage payment transactions"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Payments" }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total Processed</p><p className="text-lg font-bold text-primary">{formatPrice(stats.total)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Successful</p><p className="text-lg font-bold text-emerald-600">{stats.completed}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Failed</p><p className="text-lg font-bold text-red-600">{stats.failed}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pending</p><p className="text-lg font-bold text-amber-600">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Refunds</p><p className="text-lg font-bold text-muted-foreground">{stats.refunded}</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by payment ID or customer..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1) } }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Completed", "Pending", "Failed", "Refunded"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} transactions found</span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-mono text-xs font-medium">{p.paymentId}</TableCell>
                      <TableCell className="font-medium">{p.orderId}</TableCell>
                      <TableCell>{p.customerName}</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(p.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          {p.method}
                        </div>
                      </TableCell>
                      <TableCell className="text-center"><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <EmptyState
                  icon={<Wallet className="h-12 w-12" />}
                  title="No payments found"
                  description="Try adjusting your search or filters to find what you're looking for."
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {!isLoading && totalPages > 1 && (
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
