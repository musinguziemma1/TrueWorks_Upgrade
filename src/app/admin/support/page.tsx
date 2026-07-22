"use client"

import { useState } from "react"
import { LifeBuoy, Search } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Ticket {
  id: string; ticketId: string; customer: string; subject: string; priority: string; status: string; date: string
}

const tickets: Ticket[] = [
  { id: "1", ticketId: "#TKT-001", customer: "Sarah Mbabazi", subject: "Download link not working", priority: "High", status: "Open", date: "2026-07-20" },
  { id: "2", ticketId: "#TKT-002", customer: "John Okello", subject: "Payment issue with Airtel Money", priority: "Critical", status: "Open", date: "2026-07-20" },
  { id: "3", ticketId: "#TKT-003", customer: "Grace Nabatanzi", subject: "How to update my profile?", priority: "Low", status: "Closed", date: "2026-07-19" },
  { id: "4", ticketId: "#TKT-004", customer: "David Kato", subject: "Request refund for duplicate purchase", priority: "Medium", status: "In Progress", date: "2026-07-19" },
  { id: "5", ticketId: "#TKT-005", customer: "Alice Muhwezi", subject: "Product not compatible with my device", priority: "Medium", status: "Open", date: "2026-07-18" },
  { id: "6", ticketId: "#TKT-006", customer: "Peter Ssempijja", subject: "Invoice needed for tax purposes", priority: "Low", status: "Closed", date: "2026-07-17" },
  { id: "7", ticketId: "#TKT-007", customer: "Susan Nalwoga", subject: "Can't access purchased bundle", priority: "High", status: "In Progress", date: "2026-07-17" },
  { id: "8", ticketId: "#TKT-008", customer: "Robert Mugisha", subject: "Discount code not applying", priority: "Medium", status: "Open", date: "2026-07-16" },
  { id: "9", ticketId: "#TKT-009", customer: "Faith Akello", subject: "Account password reset", priority: "Low", status: "Closed", date: "2026-07-15" },
  { id: "10", ticketId: "#TKT-010", customer: "James Mwangi", subject: "License key for 2nd device", priority: "High", status: "Open", date: "2026-07-15" },
]

export default function SupportPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = tickets.filter((t) => {
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.customer.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== "All" && t.status !== statusFilter) return false
    if (priorityFilter !== "All" && t.priority !== priorityFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Support"
        description="Manage customer support tickets"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Support" }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1) } }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Open", "In Progress", "Closed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => { if (v) { setPriorityFilter(v); setPage(1) } }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Critical", "High", "Medium", "Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} tickets found</span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Priority</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs font-medium">{t.ticketId}</TableCell>
                  <TableCell>{t.customer}</TableCell>
                  <TableCell className="font-medium">{t.subject}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={t.priority} /></TableCell>
                  <TableCell className="text-center"><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="link" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<LifeBuoy className="h-12 w-12" />}
              title="No tickets found"
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
