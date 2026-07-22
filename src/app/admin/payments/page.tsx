"use client"

import { useState } from "react"
import { Wallet, Search, CreditCard } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Payment {
  id: string; transactionId: string; orderId: string; customer: string
  amount: string; method: string; status: string; date: string
}

const payments: Payment[] = [
  { id: "1", transactionId: "TXN-78901", orderId: "#ORD-1245", customer: "Sarah Mbabazi", amount: "UGX 125,000", method: "MTN MoMo", status: "Completed", date: "2026-07-20" },
  { id: "2", transactionId: "TXN-78902", orderId: "#ORD-1244", customer: "John Okello", amount: "UGX 178,000", method: "Airtel Money", status: "Completed", date: "2026-07-20" },
  { id: "3", transactionId: "TXN-78903", orderId: "#ORD-1243", customer: "Grace Nabatanzi", amount: "UGX 45,000", method: "Card", status: "Pending", date: "2026-07-19" },
  { id: "4", transactionId: "TXN-78904", orderId: "#ORD-1242", customer: "David Kato", amount: "UGX 250,000", method: "MTN MoMo", status: "Completed", date: "2026-07-19" },
  { id: "5", transactionId: "TXN-78905", orderId: "#ORD-1241", customer: "Alice Muhwezi", amount: "UGX 67,000", method: "Airtel Money", status: "Refunded", date: "2026-07-18" },
  { id: "6", transactionId: "TXN-78906", orderId: "#ORD-1240", customer: "Peter Ssempijja", amount: "UGX 140,000", method: "Card", status: "Completed", date: "2026-07-18" },
  { id: "7", transactionId: "TXN-78907", orderId: "#ORD-1239", customer: "Susan Nalwoga", amount: "UGX 55,000", method: "MTN MoMo", status: "Completed", date: "2026-07-17" },
  { id: "8", transactionId: "TXN-78908", orderId: "#ORD-1238", customer: "Robert Mugisha", amount: "UGX 105,000", method: "Airtel Money", status: "Failed", date: "2026-07-17" },
  { id: "9", transactionId: "TXN-78909", orderId: "#ORD-1237", customer: "Faith Akello", amount: "UGX 29,000", method: "MTN MoMo", status: "Completed", date: "2026-07-16" },
  { id: "10", transactionId: "TXN-78910", orderId: "#ORD-1236", customer: "James Mwangi", amount: "UGX 195,000", method: "Card", status: "Pending", date: "2026-07-16" },
]

export default function PaymentsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = payments.filter((p) => {
    if (search && !p.transactionId.toLowerCase().includes(search.toLowerCase()) && !p.customer.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== "All" && p.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const stats = {
    total: payments.reduce((s, p) => s + parseInt(p.amount.replace(/[^0-9]/g, "")), 0),
    completed: payments.filter((p) => p.status === "Completed").length,
    failed: payments.filter((p) => p.status === "Failed").length,
    pending: payments.filter((p) => p.status === "Pending").length,
    refunded: payments.filter((p) => p.status === "Refunded").length,
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        description="Monitor and manage payment transactions"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Payments" }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total Processed</p><p className="text-lg font-bold text-primary">UGX {Math.round(stats.total / 1000000).toLocaleString()}M</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Successful</p><p className="text-lg font-bold text-green-600">{stats.completed}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Failed</p><p className="text-lg font-bold text-red-600">{stats.failed}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pending</p><p className="text-lg font-bold text-amber-600">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Refunds</p><p className="text-lg font-bold text-muted-foreground">{stats.refunded}</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by transaction or customer..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-medium">{p.transactionId}</TableCell>
                  <TableCell className="font-medium">{p.orderId}</TableCell>
                  <TableCell>{p.customer}</TableCell>
                  <TableCell className="text-right font-medium">{p.amount}</TableCell>
                  <TableCell><div className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-muted-foreground" />{p.method}</div></TableCell>
                  <TableCell className="text-center"><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{p.date}</TableCell>
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
