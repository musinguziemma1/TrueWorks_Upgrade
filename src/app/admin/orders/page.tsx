"use client"

import React, { useState } from "react"
import { Search, ChevronDown, ChevronUp, CreditCard, ShoppingCart } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface OrderItem { name: string; qty: number; price: number }
interface Order {
  id: string; customer: string; email: string; items: OrderItem[]
  total: number; paymentMethod: string; paymentStatus: string; orderStatus: string; date: string
}

const orders: Order[] = [
  { id: "#ORD-1245", customer: "Sarah Mbabazi", email: "sarah@example.com", items: [{ name: "Business Template Pro", qty: 1, price: 125000 }], total: 125000, paymentMethod: "MTN MoMo", paymentStatus: "Paid", orderStatus: "Processing", date: "2026-07-20" },
  { id: "#ORD-1244", customer: "John Okello", email: "john@example.com", items: [{ name: "Admin Dashboard Kit", qty: 2, price: 89000 }], total: 178000, paymentMethod: "Airtel Money", paymentStatus: "Paid", orderStatus: "Completed", date: "2026-07-20" },
  { id: "#ORD-1243", customer: "Grace Nabatanzi", email: "grace@example.com", items: [{ name: "UI Component Pack", qty: 1, price: 45000 }], total: 45000, paymentMethod: "Card", paymentStatus: "Pending", orderStatus: "Pending", date: "2026-07-19" },
  { id: "#ORD-1242", customer: "David Kato", email: "david@example.com", items: [{ name: "E-commerce Bundle", qty: 1, price: 250000 }], total: 250000, paymentMethod: "MTN MoMo", paymentStatus: "Paid", orderStatus: "Completed", date: "2026-07-19" },
  { id: "#ORD-1241", customer: "Alice Muhwezi", email: "alice@example.com", items: [{ name: "Marketing Suite", qty: 1, price: 67000 }], total: 67000, paymentMethod: "Airtel Money", paymentStatus: "Refunded", orderStatus: "Cancelled", date: "2026-07-18" },
  { id: "#ORD-1240", customer: "Peter Ssempijja", email: "peter@example.com", items: [{ name: "Analytics Dashboard", qty: 1, price: 95000 }, { name: "UI Component Pack", qty: 1, price: 45000 }], total: 140000, paymentMethod: "Card", paymentStatus: "Paid", orderStatus: "Completed", date: "2026-07-18" },
  { id: "#ORD-1239", customer: "Susan Nalwoga", email: "susan@example.com", items: [{ name: "SaaS Landing Page", qty: 1, price: 55000 }], total: 55000, paymentMethod: "MTN MoMo", paymentStatus: "Paid", orderStatus: "Shipped", date: "2026-07-17" },
  { id: "#ORD-1238", customer: "Robert Mugisha", email: "robert@example.com", items: [{ name: "Invoice Generator", qty: 3, price: 35000 }], total: 105000, paymentMethod: "Airtel Money", paymentStatus: "Pending", orderStatus: "Pending", date: "2026-07-17" },
  { id: "#ORD-1237", customer: "Faith Akello", email: "faith@example.com", items: [{ name: "Portfolio Template", qty: 1, price: 29000 }], total: 29000, paymentMethod: "MTN MoMo", paymentStatus: "Paid", orderStatus: "Completed", date: "2026-07-16" },
  { id: "#ORD-1236", customer: "James Mwangi", email: "james@example.com", items: [{ name: "CRM Software Kit", qty: 1, price: 195000 }], total: 195000, paymentMethod: "Card", paymentStatus: "Failed", orderStatus: "Pending", date: "2026-07-16" },
  { id: "#ORD-1235", customer: "Esther Kyomugisha", email: "esther@example.com", items: [{ name: "Social Media Pack", qty: 2, price: 49000 }], total: 98000, paymentMethod: "Airtel Money", paymentStatus: "Paid", orderStatus: "Completed", date: "2026-07-15" },
  { id: "#ORD-1234", customer: "Thomas Ochieng", email: "thomas@example.com", items: [{ name: "HR Dashboard", qty: 1, price: 79000 }], total: 79000, paymentMethod: "MTN MoMo", paymentStatus: "Paid", orderStatus: "Processing", date: "2026-07-15" },
]

const fmtPrice = (n: number) => "UGX " + n.toLocaleString("en-UG")
const fmtDate = (d: string) => d

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [orderFilter, setOrderFilter] = useState("All")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = orders.filter((o) => {
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.customer.toLowerCase().includes(search.toLowerCase())) return false
    if (paymentFilter !== "All" && o.paymentStatus !== paymentFilter) return false
    if (orderFilter !== "All" && o.orderStatus !== orderFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set())
    else setSelected(new Set(paginated.map((o) => o.id)))
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Manage customer orders and track order status"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Orders" }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders or customer..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
        </div>
        <Select value={paymentFilter} onValueChange={(v) => { if (v) { setPaymentFilter(v); setPage(1) } }}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Paid", "Pending", "Failed", "Refunded"].map((s) => <SelectItem key={s} value={s}>Payment: {s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={orderFilter} onValueChange={(v) => { if (v) { setOrderFilter(v); setPage(1) } }}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Processing", "Completed", "Pending", "Cancelled", "Shipped"].map((s) => <SelectItem key={s} value={s}>Status: {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} orders found</span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={selected.size === paginated.length && paginated.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-center">Payment Status</TableHead>
                <TableHead className="text-center">Order Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow className={selected.has(order.id) ? "bg-primary/5" : ""}>
                    <TableCell><Checkbox checked={selected.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} /></TableCell>
                    <TableCell>
                      <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="flex items-center gap-1 font-medium text-primary hover:underline">
                        {order.id}
                        {expandedId === order.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>{order.customer}<span className="text-xs text-muted-foreground block">{order.email}</span></div>
                    </TableCell>
                    <TableCell>{order.items.length} item{order.items.length > 1 ? "s" : ""}</TableCell>
                    <TableCell className="text-right font-medium">{fmtPrice(order.total)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{order.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><StatusBadge status={order.paymentStatus} /></TableCell>
                    <TableCell className="text-center"><StatusBadge status={order.orderStatus} /></TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtDate(order.date)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="link" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                  {expandedId === order.id && (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                          <p className="text-sm font-medium">Order Items</p>
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{item.name} x{item.qty}</span>
                              <span className="font-medium">{fmtPrice(item.price * item.qty)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-2">
                            <span>Total</span>
                            <span>{fmtPrice(order.total)}</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<ShoppingCart className="h-12 w-12" />}
              title="No orders found"
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
