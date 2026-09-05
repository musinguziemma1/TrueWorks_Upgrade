"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Users, Search, Mail, Phone, Calendar, DollarSign, ShoppingCart,
  ChevronRight, Trash2, FileSpreadsheet, UserCheck, BarChart3,
  Filter, X as XIcon, Sparkles, TrendingUp, ArrowUpRight, Loader2,
} from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Doc } from "@convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { downloadCsv, toCsv } from "@/lib/csv"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { toast } from "sonner"
import {
  useCustomers,
  deleteCustomer,
} from "@/lib/admin-queries"

const fmtLTV = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)

type CustomerDoc = Doc<"customers">

const SORT_OPTIONS = [
  { v: "newest", l: "Newest first" },
  { v: "oldest", l: "Oldest first" },
  { v: "ltv_high", l: "LTV: high to low" },
  { v: "ltv_low", l: "LTV: low to high" },
  { v: "orders_high", l: "Orders: high to low" },
  { v: "name", l: "Name A → Z" },
]

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
  const [sort, setSort] = useState("newest")
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDoc | null>(null)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<CustomerDoc | null>(null)

  const customers = useCustomers({ search: search || undefined })
  const customerStats = useQuery(api.customers.stats)
  const customerOrders = useQuery(
    api.orders.listByCustomerEmail,
    selectedCustomer ? { email: selectedCustomer.email } : "skip"
  )
  const removeCustomer = deleteCustomer.useMutation()

  const isLoading = customers === undefined
  const list = customers ?? []
  const sorted = (() => {
    const a = [...list]
    switch (sort) {
      case "oldest":     a.sort((x, y) => x.createdAt - y.createdAt); break
      case "ltv_high":   a.sort((x, y) => y.lifetimeValue - x.lifetimeValue); break
      case "ltv_low":    a.sort((x, y) => x.lifetimeValue - y.lifetimeValue); break
      case "orders_high":a.sort((x, y) => y.totalOrders - x.totalOrders); break
      case "name":       a.sort((x, y) => x.name.localeCompare(y.name)); break
      default:           a.sort((x, y) => y.createdAt - x.createdAt)
    }
    return a
  })()
  const filtered = sorted

  const perPage = 8
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const handleDelete = async () => {
    if (!deleteTarget) return
    await removeCustomer({ id: deleteTarget._id as never })
    toast.success("Customer deleted")
    if (selectedCustomer?._id === deleteTarget._id) setSelectedCustomer(null)
  }

  const handleExportCsv = () => {
    const csv = toCsv(
      filtered.map((c) => ({
        name: c.name,
        email: c.email,
        phone: c.phone ?? "",
        orders: c.totalOrders,
        ltv: c.lifetimeValue,
        newsletter: c.newsletterSubscribed ? "yes" : "no",
        joined: new Date(c.createdAt).toISOString().slice(0, 10),
      }))
    )
    downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}`, csv)
  }

  const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"

  const totalCustomers = customerStats?.total ?? 0
  const totalOrders = list.reduce((s, c) => s + c.totalOrders, 0)
  const avgLtv = totalCustomers > 0
    ? Math.round((customerStats?.totalLtv ?? 0) / totalCustomers)
    : 0
  const avgOrders = totalCustomers > 0
    ? totalOrders / totalCustomers
    : 0

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
              <span className="font-semibold text-white">Customers</span>
            </nav>
            <h1 className="mt-3 font-heading text-3xl font-semibold text-white md:text-4xl">
              Customers
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              View and manage your customer base.
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

      {/* ─── Stats row: featured Total LTV + 2x2 secondary ────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="gradient-brand relative overflow-hidden rounded-2xl p-6 shadow-elevated">
          <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">
                Total Customer LTV
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent-light">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 font-heading text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">
              {fmtLTV(customerStats?.totalLtv ?? 0)}
            </p>
            <p className="mt-2 text-xs text-white/70">
              Across {customerStats?.total ?? 0} {(customerStats?.total ?? 0) === 1 ? "customer" : "customers"} · avg {fmtLTV(avgLtv)}
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
            { label: "Total", value: customerStats?.total ?? 0, icon: Users, tint: "text-foreground bg-muted", footnote: "All customers" },
            { label: "Newsletter", value: customerStats?.subscribed ?? 0, icon: UserCheck, tint: "text-emerald-700 bg-emerald-50", footnote: "Subscribed" },
            { label: "Top spender LTV", value: fmtLTV(customerStats?.topLtv ?? 0), icon: TrendingUp, tint: "text-primary bg-primary/10", footnote: "Highest single LTV" },
            { label: "Avg orders", value: avgOrders.toFixed(1), icon: ShoppingCart, tint: "text-blue-700 bg-blue-50", footnote: "Per customer" },
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
            placeholder="Search by name, email, or phone..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
            className="h-10 pl-10 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setPage(1) }}
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
            <span className="hidden sm:inline">Sort</span>
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-white p-1">
            {SORT_OPTIONS.slice(0, 3).map((o) => (
              <button
                key={o.v}
                onClick={() => setSort(o.v)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  sort === o.v ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={sort === o.v}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Two-col: customer table + detail panel ────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </span>
                  <CardTitle>Customers</CardTitle>
                </div>
                <CardAction>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <BarChart3 className="h-3.5 w-3.5" />
                    {filtered.length} {filtered.length === 1 ? "customer" : "customers"} found
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-right">LTV</TableHead>
                      <TableHead className="text-center">Newsletter</TableHead>
                      <TableHead className="pr-4 text-right">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((customer) => {
                      const active = selectedCustomer?._id === customer._id
                      return (
                        <TableRow
                          key={customer._id}
                          onClick={() => setSelectedCustomer(customer)}
                          className={cn(
                            "group cursor-pointer transition-colors",
                            active ? "bg-primary/[0.06]" : "hover:bg-muted/40"
                          )}
                        >
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 ring-2 ring-white">
                                <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary text-xs font-bold text-white">
                                  {getInitials(customer.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">{customer.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {customer.phone ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-primary/[0.08] px-2 text-xs font-bold text-primary tabular-nums">
                              {customer.totalOrders}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-heading text-sm font-bold tabular-nums text-foreground">
                              {fmtLTV(customer.lifetimeValue)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusBadge status={customer.newsletterSubscribed ? "Subscribed" : "Unsubscribed"} />
                          </TableCell>
                          <TableCell className="pr-4 text-right text-xs text-muted-foreground tabular-nums">
                            {new Date(customer.createdAt).toLocaleDateString("en-UG")}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {filtered.length === 0 && (
                  <EmptyState
                    icon={<Users className="h-12 w-12" />}
                    title="No customers found"
                    description="Try adjusting your search."
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
                <span className="font-semibold text-foreground">{filtered.length}</span> customers
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
        </div>

        {/* ─── Customer detail panel ───────────────────────────── */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="sticky top-6 space-y-4">
              <Card>
                {/* Gradient-brand header */}
                <div className="gradient-brand relative overflow-hidden rounded-t-2xl p-5">
                  <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
                  <div className="relative flex items-start gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-white/30">
                      <AvatarFallback className="bg-white/20 text-base font-bold text-white">
                        {getInitials(selectedCustomer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-heading text-base font-semibold text-white">
                        {selectedCustomer.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-white/75">{selectedCustomer.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {selectedCustomer.newsletterSubscribed ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-light">
                            <Sparkles className="h-2.5 w-2.5" /> Subscribed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
                            Unsubscribed
                          </span>
                        )}
                        {selectedCustomer.totalOrders > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/85 tabular-nums">
                            {selectedCustomer.totalOrders} orders
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="space-y-4 p-5">
                  {/* LTV highlight band */}
                  <div className="rounded-xl border border-accent/20 bg-accent/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-dark">
                        Lifetime value
                      </p>
                      <ArrowUpRight className="h-3.5 w-3.5 text-accent-dark" />
                    </div>
                    <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums">
                      {fmtLTV(selectedCustomer.lifetimeValue)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Avg {fmtLTV(
                        selectedCustomer.totalOrders > 0
                          ? Math.round(selectedCustomer.lifetimeValue / selectedCustomer.totalOrders)
                          : 0
                      )} per order
                    </p>
                  </div>

                  {/* Quick facts */}
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <a
                        href={`mailto:${selectedCustomer.email}`}
                        className="truncate font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {selectedCustomer.email}
                      </a>
                    </li>
                    <li className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate font-medium text-foreground">
                        {selectedCustomer.phone ?? "—"}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2">
                      <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {selectedCustomer.totalOrders} order{selectedCustomer.totalOrders === 1 ? "" : "s"}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        Joined {new Date(selectedCustomer.createdAt).toLocaleDateString("en-UG")}
                      </span>
                    </li>
                  </ul>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${selectedCustomer.email}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(selectedCustomer)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ShoppingCart className="h-4 w-4" />
                    </span>
                    <CardTitle>Recent orders</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {customerOrders === undefined ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <p className="text-sm text-muted-foreground">No orders yet</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {customerOrders.slice(0, 6).map((o) => (
                        <li key={o._id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {o.orderNumber}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(o.createdAt).toLocaleDateString("en-UG")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={o.paymentStatus === "completed" ? "Paid" : o.paymentStatus} />
                            <span className="font-heading text-sm font-bold tabular-nums text-foreground">
                              {fmtLTV(o.total)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
                  <Users className="h-7 w-7 text-muted-foreground" />
                </span>
                <div>
                  <p className="font-heading text-base font-semibold text-foreground">
                    Select a customer
                  </p>
                  <p className="mt-1 max-w-[18rem] text-sm text-muted-foreground">
                    Click a row to see contact info, lifetime value, and recent orders.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Delete ${deleteTarget?.name ?? "this customer"}?`}
        description="This permanently removes the customer record. Their orders remain in history but will no longer be linked. This action cannot be undone."
        confirmLabel="Delete customer"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
