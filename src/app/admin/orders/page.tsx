"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Search, ChevronDown, ChevronUp, ChevronRight, CreditCard,
  FileSpreadsheet, DollarSign, CheckCircle2, Clock, RotateCcw,
  CalendarRange, BarChart3, Filter, X as XIcon,
  ShoppingBag, Edit3, Trash2, FileText,
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { cn } from "@/lib/utils"
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
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#071A33] to-[#071A33] px-6 py-8 lg:px-8 lg:py-10">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-accent/[0.10] blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[24rem] w-[24rem] rounded-full bg-blue-500/[0.10] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.05] blur-3xl" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "400px 400px",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-white/60">
              <Link href="/admin" className="transition-colors hover:text-white">Dashboard</Link>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="font-semibold text-white">Orders</span>
            </nav>
            <h1 className="mt-3 font-heading text-3xl font-semibold text-white md:text-4xl">
              Orders
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Manage customer orders and track order status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
            <Link
              href="/admin/analytics"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <BarChart3 className="h-4 w-4" /> View analytics
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats row: featured revenue + 4 small cards ──────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="gradient-brand relative overflow-hidden rounded-2xl p-6 shadow-elevated">
          <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">
                Total Revenue
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent-light">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 font-heading text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">
              {fmtPrice(orderStats?.totalRevenue ?? 0)}
            </p>
            <p className="mt-2 text-xs text-white/70">
              From {orderStats?.total ?? 0} {(orderStats?.total ?? 0) === 1 ? "order" : "orders"} in total
            </p>
            <Link
              href="/admin/analytics"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-light transition-transform hover:translate-x-0.5"
            >
              Open analytics
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {[
            { label: "Total", value: orderStats?.total ?? 0, icon: ShoppingBag, tint: "text-foreground bg-muted", footnote: "All orders" },
            { label: "Pending", value: orderStats?.pending ?? 0, icon: Clock, tint: "text-amber-700 bg-amber-50", footnote: "Awaiting action" },
            { label: "Completed", value: orderStats?.completed ?? 0, icon: CheckCircle2, tint: "text-emerald-700 bg-emerald-50", footnote: "Fulfilled" },
            { label: "Refunded", value: orderStats?.refunded ?? 0, icon: RotateCcw, tint: "text-orange-700 bg-orange-50", footnote: "Returned" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.tint)}>
                    <s.icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{s.footnote}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, customer, or email..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); resetPage() }}
            className="h-10 pl-10 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); resetPage() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </div>
          <Select value={paymentFilter} onValueChange={(v) => { if (v) { setPaymentFilter(v); resetPage() } }}>
            <SelectTrigger className="h-10 w-[180px]"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent>
              {["All", "pending", "completed", "failed", "refunded"].map((s) => (
                <SelectItem key={s} value={s}>Payment: {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={orderFilter} onValueChange={(v) => { if (v) { setOrderFilter(v); resetPage() } }}>
            <SelectTrigger className="h-10 w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {["All", "Processing", "Completed", "Pending", "Cancelled"].map((s) => (
                <SelectItem key={s} value={s}>Status: {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => { if (v) { setRange(v); resetPage() } }}>
            <SelectTrigger className="h-10 w-[160px]"><CalendarRange className="h-4 w-4 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Bulk action bar ──────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="sticky top-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-elevated backdrop-blur-sm">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
              {selected.size}
            </span>
            {selected.size === 1 ? "order selected" : "orders selected"}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmBulk(true)}
              className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark completed
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <XIcon className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <CardTitle>Orders</CardTitle>
            </div>
            <CardAction>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                {filtered.length} {filtered.length === 1 ? "order" : "orders"} found
              </span>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={selected.size === paginated.length && paginated.length > 0}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-center">Payment Status</TableHead>
                  <TableHead className="text-center">Order Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="w-10 pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((order) => (
                  <React.Fragment key={order._id}>
                    <TableRow
                      className={cn(
                        "group transition-colors",
                        selected.has(order._id) ? "bg-primary/5" : "hover:bg-muted/40"
                      )}
                    >
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selected.has(order._id)}
                          onCheckedChange={() => toggleSelect(order._id)}
                          aria-label={`Select order ${order.orderNumber}`}
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                          className="inline-flex items-center gap-1.5 text-left"
                        >
                          <span className="font-heading font-semibold text-foreground">
                            {order.orderNumber}
                          </span>
                          {expandedId === order._id ? (
                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{order.customerName}</p>
                          <p className="truncate text-xs text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-primary/[0.08] px-2 text-xs font-bold text-primary">
                          {order.items.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-heading text-sm font-bold tabular-nums text-foreground">
                          {fmtPrice(order.total)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          {order.paymentMethod}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={order.paymentStatus === "completed" ? "Paid" : order.paymentStatus === "pending" ? "Pending" : order.paymentStatus === "refunded" ? "Refunded" : "Failed"} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={order.orderStatus === "completed" ? "Completed" : order.orderStatus === "processing" ? "Processing" : order.orderStatus === "cancelled" ? "Cancelled" : "Pending"} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                        {new Date(order.createdAt).toLocaleDateString("en-UG")}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => openStatusDialog(order._id, order.paymentStatus, order.orderStatus, order.notes)}
                            aria-label={`Edit order ${order.orderNumber}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(order._id)}
                            aria-label={`Delete order ${order.orderNumber}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === order._id && (
                      <TableRow key={`${order._id}-expanded`} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={10} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <FileText className="h-4 w-4" />
                              </span>
                              <p className="text-sm font-semibold text-foreground">Order details</p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-white">
                              {order.items.map((item, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "flex items-center justify-between px-3 py-2 text-sm",
                                    i > 0 && "border-t border-border/60"
                                  )}
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="font-medium text-foreground truncate">{item.productName}</span>
                                    <span className="text-xs text-muted-foreground">× {item.quantity}</span>
                                  </div>
                                  <span className="font-semibold tabular-nums text-foreground">{fmtPrice(item.price * item.quantity)}</span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between border-t-2 border-border/80 bg-muted/40 px-3 py-2 text-sm font-bold">
                                <span className="text-foreground">Total</span>
                                <span className="font-heading tabular-nums text-foreground">{fmtPrice(order.total)}</span>
                              </div>
                            </div>
                            {order.notes && (
                              <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Notes: </span>
                                {order.notes}
                              </p>
                            )}
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
                icon={<ShoppingBag className="h-12 w-12" />}
                title="No orders found"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            )}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(safePage - 1) * perPage + 1}</span> to{" "}
            <span className="font-semibold text-foreground">{Math.min(safePage * perPage, filtered.length)}</span> of{" "}
            <span className="font-semibold text-foreground">{filtered.length}</span> orders
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
              {safePage} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Button>
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
        title={`Mark ${selected.size} order${selected.size === 1 ? "" : "s"} as completed?`}
        description="All selected orders will be updated in a single atomic operation."
        confirmLabel="Mark completed"
        onConfirm={handleBulkComplete}
      />

      <Dialog open={!!statusDialogId} onOpenChange={() => setStatusDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Edit3 className="h-4 w-4" />
              </span>
              Update Order Status
            </DialogTitle>
          </DialogHeader>
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
            <Button onClick={handleStatusUpdate} className="gradient-gold text-primary-dark">
              Update Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
