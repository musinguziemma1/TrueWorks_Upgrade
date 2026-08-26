"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ChevronDown, ChevronUp, CreditCard, FileSpreadsheet, DollarSign, CheckCircle2, Clock, RotateCcw, CalendarRange } from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { downloadCsv, toCsv } from "@/lib/csv"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"
import {
  useOrders,
  updateOrderStatus,
  deleteOrder,
} from "@/lib/admin-queries"

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filters are URL-synced: refresh keeps them and views are shareable.
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "")
  const search = useDebouncedValue(searchInput, 300)
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get("payment") ?? "All")
  const [orderFilter, setOrderFilter] = useState(searchParams.get("status") ?? "All")
  const [range, setRange] = useState(searchParams.get("range") ?? "all")
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [statusDialogId, setStatusDialogId] = useState<string | null>(null)
  const [newPaymentStatus, setNewPaymentStatus] = useState("")
  const [newOrderStatus, setNewOrderStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [confirmBulk, setConfirmBulk] = useState(false)

  // Pure render: the server converts daysAgo to a timestamp cutoff.

  // Server-side search + filters (debounced) instead of re-filtering the
  // entire table client-side on every keystroke.
  const orders = useOrders({
    paymentStatus: paymentFilter !== "All" ? paymentFilter : undefined,
    orderStatus: orderFilter !== "All" ? orderFilter.toLowerCase() : undefined,
    search: search || undefined,
    daysAgo: range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : undefined,
    limit: 500,
  })
  const orderStats = useQuery(api.orders.stats)
  const updateStatus = updateOrderStatus.useMutation()
  const bulkUpdate = useMutation(api.orders.bulkUpdateStatus)
  const removeOrder = deleteOrder.useMutation()

  const isLoading = orders === undefined
  const filtered = orders ?? []

  const perPage = 8
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  // Keep the URL in sync with the active view (refresh-safe, shareable).
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (paymentFilter !== "All") params.set("payment", paymentFilter)
    if (orderFilter !== "All") params.set("status", orderFilter)
    if (range !== "all") params.set("range", range)
    if (safePage > 1) params.set("page", String(safePage))
    const qs = params.toString()
    router.replace(qs ? `/admin/orders?${qs}` : "/admin/orders", { scroll: false })
  }, [search, paymentFilter, orderFilter, range, safePage, router])

  const resetPage = () => setPage(1)

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set())
    else setSelected(new Set(paginated.map((o) => o._id)))
  }

  const openStatusDialog = (orderId: string, currentPayment: string, currentOrder: string, currentNotes?: string) => {
    setStatusDialogId(orderId)
    setNewPaymentStatus(currentPayment)
    setNewOrderStatus(currentOrder)
    setNotes(currentNotes ?? "")
  }

  const handleStatusUpdate = async () => {
    if (!statusDialogId) return
    try {
      await updateStatus({
        id: statusDialogId as never,
        paymentStatus: newPaymentStatus as never,
        orderStatus: newOrderStatus as never,
        notes: notes || undefined,
      } as never)
      toast.success("Order updated")
      setStatusDialogId(null)
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await removeOrder({ id: deleteTarget as never })
    toast.success("Order deleted")
  }

  const handleExportCsv = () => {
    const csv = toCsv(
      filtered.map((o) => ({
        order: o.orderNumber,
        date: new Date(o.createdAt).toISOString().slice(0, 10),
        customer: o.customerName,
        email: o.customerEmail,
        items: o.items.length,
        total: o.total,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
      }))
    )
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}`, csv)
  }

  const handleBulkComplete = async () => {
    if (selected.size === 0) return
    // One atomic transaction — no partial-failure states.
    const result = await bulkUpdate({ ids: [...selected] as never, orderStatus: "completed" as never })
    toast.success(`${result.updated} order(s) marked completed`)
    setSelected(new Set())
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Manage customer orders and track order status"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Orders" }]}
        action={
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Total", value: orderStats?.total ?? 0, icon: CreditCard, color: "text-foreground" },
          { label: "Revenue", value: fmtPrice(orderStats?.totalRevenue ?? 0), icon: DollarSign, color: "text-[#0B2545]" },
          { label: "Pending", value: orderStats?.pending ?? 0, icon: Clock, color: "text-amber-600" },
          { label: "Completed", value: orderStats?.completed ?? 0, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Refunded", value: orderStats?.refunded ?? 0, icon: RotateCcw, color: "text-orange-600" },
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
          <Input placeholder="Search orders or customer..." value={searchInput} onChange={(e) => { setSearchInput(e.target.value); resetPage() }} className="pl-10" />
        </div>
        <Select value={paymentFilter} onValueChange={(v) => { if (v) { setPaymentFilter(v); resetPage() } }}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "pending", "completed", "failed", "refunded"].map((s) => <SelectItem key={s} value={s}>Payment: {s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={orderFilter} onValueChange={(v) => { if (v) { setOrderFilter(v); resetPage() } }}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Processing", "Completed", "Pending", "Cancelled"].map((s) => <SelectItem key={s} value={s}>Status: {s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(v) => { if (v) { setRange(v); resetPage() } }}>
          <SelectTrigger className="w-[150px]"><CalendarRange className="h-4 w-4 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-[#0B2545]/5 rounded-lg border border-[#0B2545]/10">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button variant="outline" size="sm" onClick={() => setConfirmBulk(true)}>
            <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" /> Mark Completed
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardAction><span className="text-sm text-muted-foreground">{filtered.length} orders</span></CardAction>
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
                  <React.Fragment key={order._id}>
                    <TableRow className={selected.has(order._id) ? "bg-primary/5" : ""}>
                      <TableCell><Checkbox checked={selected.has(order._id)} onCheckedChange={() => toggleSelect(order._id)} /></TableCell>
                      <TableCell>
                        <button onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                          className="flex items-center gap-1 font-medium text-primary hover:underline">
                          {order.orderNumber}
                          {expandedId === order._id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>{order.customerName}<span className="text-xs text-muted-foreground block">{order.customerEmail}</span></div>
                      </TableCell>
                      <TableCell>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</TableCell>
                      <TableCell className="text-right font-medium">{fmtPrice(order.total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{order.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={order.paymentStatus === "completed" ? "Paid" : order.paymentStatus === "pending" ? "Pending" : order.paymentStatus === "refunded" ? "Refunded" : "Failed"} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={order.orderStatus === "completed" ? "Completed" : order.orderStatus === "processing" ? "Processing" : order.orderStatus === "cancelled" ? "Cancelled" : "Pending"} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-UG")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="link" size="sm" onClick={() => openStatusDialog(order._id, order.paymentStatus, order.orderStatus, order.notes)}>Edit</Button>
                          <Button variant="link" size="sm" className="text-destructive" onClick={() => setDeleteTarget(order._id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === order._id && (
                      <TableRow key={`${order._id}-expanded`}>
                        <TableCell colSpan={10} className="bg-muted/30 p-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Order Items:</p>
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{item.productName} x{item.quantity}</span>
                                <span>{fmtPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                            <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                              <span>Total</span><span>{fmtPrice(order.total)}</span>
                            </div>
                            {order.notes && <p className="text-sm text-muted-foreground">Notes: {order.notes}</p>}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <EmptyState icon={<CreditCard className="h-12 w-12" />} title="No orders found" description="Try adjusting your filters." />
            )}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length} orders
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete this order?"
        description="This permanently removes the order and its history. This action cannot be undone."
        confirmLabel="Delete order"
        destructive
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={setConfirmBulk}
        title={`Mark ${selected.size} order(s) as completed?`}
        description="All selected orders will be updated in a single atomic operation."
        confirmLabel="Mark completed"
        onConfirm={handleBulkComplete}
      />

      <Dialog open={!!statusDialogId} onOpenChange={() => setStatusDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Update Order Status</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={newPaymentStatus} onValueChange={(v) => { if (v) setNewPaymentStatus(v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pending", "completed", "failed", "refunded"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order Status</Label>
              <Select value={newOrderStatus} onValueChange={(v) => { if (v) setNewOrderStatus(v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pending", "processing", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleStatusUpdate}>Update Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
