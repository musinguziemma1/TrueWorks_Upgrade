"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Ticket,
  Loader2,
  FileSpreadsheet,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Ban,
  Percent,
  DollarSign,
  Tag,
} from "lucide-react"
import type { Doc } from "@convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { downloadCsv, toCsv } from "@/lib/csv"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  useCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  CouponInput,
} from "@/lib/admin-queries"

type CouponDoc = Doc<"coupons">

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
  { key: "disabled", label: "Disabled" },
] as const

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getCouponValue(c: CouponDoc) {
  if (c.type === "percentage") return `${c.value}%`
  if (c.type === "bundle") return `${c.value} items`
  return `$${c.value.toFixed(2)}`
}

function getStatus(c: CouponDoc, now: number): "Active" | "Expired" | "Disabled" {
  if (!c.isActive) return "Disabled"
  if (c.expiresAt && c.expiresAt < now) return "Expired"
  return "Active"
}

export default function CouponsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("q") ?? ""
  const [searchInput, setSearchInput] = useState(initialSearch)
  const search = useDebouncedValue(searchInput, 300)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState<CouponDoc | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [now] = useState(() => Date.now())

  const [code, setCode] = useState("")
  const [type, setType] = useState<"percentage" | "fixed" | "bundle">("percentage")
  const [value, setValue] = useState("")
  const [minPurchase, setMinPurchase] = useState("")
  const [usageLimit, setUsageLimit] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [isActive, setIsActive] = useState(true)

  const data = useCoupons()
  const create = createCoupon.useMutation()
  const update = updateCoupon.useMutation()
  const remove = deleteCoupon.useMutation()

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    const qs = params.toString()
    router.replace(qs ? `/admin/coupons?${qs}` : "/admin/coupons", { scroll: false })
  }, [search, router])

  const isLoading = data === undefined

  const filtered = (data ?? []).filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || getStatus(c, now).toLowerCase() === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: (data ?? []).length,
    active: (data ?? []).filter((c) => getStatus(c, now) === "Active").length,
    expired: (data ?? []).filter((c) => getStatus(c, now) === "Expired").length,
    disabled: (data ?? []).filter((c) => getStatus(c, now) === "Disabled").length,
  }

  const perPage = 10
  const totalPages = Math.ceil(filtered.length / perPage)
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const resetForm = () => {
    setCode("")
    setType("percentage")
    setValue("")
    setMinPurchase("")
    setUsageLimit("")
    setExpiresAt("")
    setIsActive(true)
  }

  const openNew = () => {
    setEditCoupon(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (c: CouponDoc) => {
    setEditCoupon(c)
    setCode(c.code)
    setType(c.type)
    setValue(String(c.value))
    setMinPurchase(c.minPurchase ? String(c.minPurchase) : "")
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : "")
    setExpiresAt(c.expiresAt ? new Date(c.expiresAt).toISOString().split("T")[0] : "")
    setIsActive(c.isActive)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!code || !value) {
      toast.error("Code and value are required")
      return
    }
    const payload: CouponInput = {
      code: code.toUpperCase(),
      type,
      value: Number(value),
      minPurchase: minPurchase ? Number(minPurchase) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
      isActive,
    }
    try {
      if (editCoupon) {
        await update({ id: editCoupon._id as never, ...payload } as never)
        toast.success("Coupon updated")
      } else {
        await create(payload as never)
        toast.success("Coupon created")
      }
      setDialogOpen(false)
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      await remove({ id: deleteId as never })
      toast.success("Coupon deleted")
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleExportCsv = () => {
    const csv = toCsv(
      filtered.map((c) => ({
        code: c.code,
        type: c.type,
        value: c.value,
        minPurchase: c.minPurchase ?? "",
        usageCount: c.usageCount,
        usageLimit: c.usageLimit ?? "",
        expiresAt: c.expiresAt
          ? new Date(c.expiresAt).toISOString().slice(0, 10)
          : "",
        status: getStatus(c, now),
        isActive: c.isActive ? "yes" : "no",
        createdAt: new Date(c.createdAt).toISOString().slice(0, 10),
      }))
    )
    downloadCsv(`coupons-${new Date().toISOString().slice(0, 10)}`, csv)
  }

  const statCards = [
    {
      label: "Total Coupons",
      value: stats.total,
      icon: Ticket,
      tint: "text-primary bg-primary/5",
      footnote: "All codes",
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle2,
      tint: "text-emerald-600 bg-emerald-50/80",
      footnote: "Ready to use",
    },
    {
      label: "Expired",
      value: stats.expired,
      icon: Clock,
      tint: "text-amber-600 bg-amber-50/80",
      footnote: "Past expiry date",
    },
    {
      label: "Disabled",
      value: stats.disabled,
      icon: Ban,
      tint: "text-muted-foreground bg-muted/50",
      footnote: "Manually turned off",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#0F3058] px-6 py-8 lg:px-8 lg:py-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
              <a href="/admin" className="transition-colors hover:text-white/80">
                Dashboard
              </a>
              <ArrowRight className="h-3 w-3" />
              <span className="text-white/70">Coupons</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Coupons
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Manage discount codes, promotions, and bundle offers
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              size="sm"
              className="bg-accent text-primary-dark hover:bg-accent/90"
              onClick={openNew}
            >
              <Plus className="h-4 w-4" /> Add Coupon
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {s.label}
                </p>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    s.tint
                  )}
                >
                  <s.icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
                {isLoading ? (
                  <span className="inline-block h-6 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  s.value
                )}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">{s.footnote}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by coupon code..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            className="h-10 pl-10 pr-9"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("")
                setPage(1)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatusFilter(f.key)
                setPage(1)
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              {f.key !== "all" && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {f.key === "active"
                    ? stats.active
                    : f.key === "expired"
                      ? stats.expired
                      : stats.disabled}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
              <Tag className="h-4 w-4" />
            </span>
            <CardTitle>Coupons</CardTitle>
          </div>
          <CardAction>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              {filtered.length} {filtered.length === 1 ? "coupon" : "coupons"}
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : paginated.length === 0 ? (
            <EmptyState
              icon={<Ticket className="h-12 w-12" />}
              title="No coupons found"
              description={
                search || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Create your first coupon to get started."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 text-primary">Code</TableHead>
                    <TableHead className="text-primary">Type</TableHead>
                    <TableHead className="text-primary">Value</TableHead>
                    <TableHead className="text-center text-primary">Usage</TableHead>
                    <TableHead className="text-primary">Min Purchase</TableHead>
                    <TableHead className="text-primary">Expires</TableHead>
                    <TableHead className="text-center text-primary">Status</TableHead>
                    <TableHead className="w-24 text-right text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((c) => {
                    const status = getStatus(c, now)
                    return (
                      <TableRow
                        key={c._id}
                        className="group transition-colors hover:bg-muted/40"
                      >
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                              <Ticket className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
                              {c.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              c.type === "percentage"
                                ? "bg-violet-50/80 text-violet-600"
                                : c.type === "fixed"
                                  ? "bg-emerald-50/80 text-emerald-600"
                                  : "bg-amber-50/80 text-amber-600"
                            )}
                          >
                            {c.type === "percentage" ? (
                              <Percent className="h-3 w-3" />
                            ) : c.type === "fixed" ? (
                              <DollarSign className="h-3 w-3" />
                            ) : (
                              <Tag className="h-3 w-3" />
                            )}
                            {c.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-foreground">
                            {getCouponValue(c)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                            {c.usageLimit
                              ? `${c.usageCount}/${c.usageLimit}`
                              : `${c.usageCount}/∞`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {c.minPurchase
                              ? `$${c.minPurchase.toFixed(2)}`
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {c.expiresAt
                              ? formatDate(c.expiresAt)
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(c)}
                              aria-label={`Edit ${c.code}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteId(c._id)}
                              aria-label={`Delete ${c.code}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(safePage - 1) * perPage + 1}
            </span>
            -{" "}
            <span className="font-medium text-foreground">
              {Math.min(safePage * perPage, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages || totalPages === 0}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null)
        }}
        title="Delete this coupon?"
        description="This permanently removes the coupon. Existing orders that already applied it are not affected, but the code can no longer be redeemed. This action cannot be undone."
        confirmLabel="Delete coupon"
        destructive
        onConfirm={handleDelete}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editCoupon ? "Edit Coupon" : "New Coupon"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-4 pr-2">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SAVE20"
                className="font-mono uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    if (v) setType(v as typeof type)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "percentage" ? "20" : "10000"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Purchase</Label>
                <Input
                  type="number"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSave}>
              {editCoupon ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
