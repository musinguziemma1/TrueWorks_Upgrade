"use client"

import React, { useState } from "react"
import { Search, ChevronDown, ChevronUp, CreditCard, Loader2 } from "lucide-react"
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
import { toast } from "sonner"
import {
  useOrders,
  updateOrderStatus,
  deleteOrder,
} from "@/lib/admin-queries"

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(n)

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [orderFilter, setOrderFilter] = useState("All")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [statusDialogId, setStatusDialogId] = useState<string | null>(null)
  const [newPaymentStatus, setNewPaymentStatus] = useState("")
  const [newOrderStatus, setNewOrderStatus] = useState("")
  const [notes, setNotes] = useState("")

  const orders = useOrders({ paymentStatus: paymentFilter !== "All" ? paymentFilter : undefined })
  const updateStatus = updateOrderStatus.useMutation()
  const removeOrder = deleteOrder.useMutation()

  const isLoading = orders === undefined

  const filtered = (orders ?? []).filter((o) => {
    if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase()) && !o.customerName.toLowerCase().includes(search.toLowerCase())) return false
    if (orderFilter !== "All" && o.orderStatus !== orderFilter.toLowerCase()) return false
    return true
  })

  const perPage = 8
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return
    try {
      await removeOrder({ id: id as never })
      toast.success("Order deleted")
    } catch (e) {
      toast.error(String(e))
    }
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
            {["All", "pending", "completed", "failed", "refunded"].map((s) => <SelectItem key={s} value={s}>Payment: {s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={orderFilter} onValueChange={(v) => { if (v) { setOrderFilter(v); setPage(1) } }}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Processing", "Completed", "Pending", "Cancelled"].map((s) => <SelectItem key={s} value={s}>Status: {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
                          <Button variant="link" size="sm" className="text-destructive" onClick={() => handleDelete(order._id)}>Delete</Button>
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
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}

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
