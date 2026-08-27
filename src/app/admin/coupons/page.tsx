"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Edit3, Trash2, Search, Ticket, Loader2, FileSpreadsheet } from "lucide-react"
import type { Doc } from "@convex/_generated/dataModel"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
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
import {
  useCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  CouponInput,
} from "@/lib/admin-queries"

type CouponDoc = Doc<"coupons">

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
  // Snapshot once on mount so `getStatus` is pure (no Date.now() in render).
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

  const filtered = (data ?? []).filter((c) => c.code.toLowerCase().includes(search.toLowerCase()))

  const handleExportCsv = () => {
    const csv = toCsv(
      filtered.map((c) => ({
        code: c.code,
        type: c.type,
        value: c.value,
        minPurchase: c.minPurchase ?? "",
        usageCount: c.usageCount,
        usageLimit: c.usageLimit ?? "",
        expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : "",
        status: getStatus(c),
        isActive: c.isActive ? "yes" : "no",
        createdAt: new Date(c.createdAt).toISOString().slice(0, 10),
      }))
    )
    downloadCsv(`coupons-${new Date().toISOString().slice(0, 10)}`, csv)
  }

  const perPage = 8
  const totalPages = Math.ceil(filtered.length / perPage)
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const openNew = () => {
    setEditCoupon(null)
    setCode("")
    setType("percentage")
    setValue("")
    setMinPurchase("")
    setUsageLimit("")
    setExpiresAt("")
    setIsActive(true)
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
    if (!code || !value) { toast.error("Code and value are required"); return }
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

  const getCouponValue = (c: CouponDoc) => {
    if (c.type === "percentage") return `${c.value}%`
    return `$${c.value.toFixed(2)}`
  }

  const getStatus = (c: CouponDoc) => {
    if (!c.isActive) return "Disabled"
    if (c.expiresAt && c.expiresAt < now) return "Expired"
    return "Active"
  }

  const usageDisplay = (c: CouponDoc) =>
    c.usageLimit ? `${c.usageCount}/${c.usageLimit}` : `${c.usageCount}/∞`

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Coupons"
        description="Manage discount coupons and promotions"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Coupons" }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Coupon</Button>
          </div>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by coupon code..." value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1) }} className="pl-10" aria-label="Search coupons by code" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Coupons</CardTitle>
            <CardAction><span className="text-sm text-muted-foreground">{filtered.length} coupons</span></CardAction>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-center">Usage</TableHead>
                  <TableHead>Min Purchase</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                    <TableCell className="font-medium">{getCouponValue(c)}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{usageDisplay(c)}</TableCell>
                    <TableCell className="text-muted-foreground">{c.minPurchase ? `$${c.minPurchase.toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-UG") : "—"}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={getStatus(c)} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)} aria-label={`Edit ${c.code}`}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteId(c._id)} aria-label={`Delete ${c.code}`}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <EmptyState icon={<Ticket className="h-12 w-12" />} title="No coupons found" description="Try adjusting your search." />
            )}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {safePage} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={safePage === totalPages || totalPages === 0} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open && !deleting) setDeleteId(null) }}
        title="Delete this coupon?"
        description="This permanently removes the coupon. Existing orders that already applied it are not affected, but the code can no longer be redeemed. This action cannot be undone."
        confirmLabel="Delete coupon"
        destructive
        onConfirm={handleDelete}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editCoupon ? "Edit Coupon" : "New Coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAVE20" className="font-mono uppercase" aria-label="Coupon code" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "percentage" ? "20" : "10000"} aria-label="Coupon value" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Purchase</Label>
                <Input type="number" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} placeholder="0" aria-label="Minimum purchase amount" />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" aria-label="Usage limit" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} aria-label="Expiry date" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Coupon active status" />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSave}>{editCoupon ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
