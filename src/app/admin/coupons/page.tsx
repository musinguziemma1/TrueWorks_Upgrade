"use client"

import { useState, useMemo } from "react"
import { Plus, Edit3, Trash2, Search, Ticket, Loader2 } from "lucide-react"
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
import { toast } from "sonner"
import {
  useCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  CouponInput,
} from "@/lib/admin-queries"

interface CouponDoc {
  _id: string;
  code: string;
  type: "percentage" | "fixed" | "bundle";
  value: number;
  minPurchase?: number;
  usageLimit?: number;
  usageCount: number;
  expiresAt?: number;
  isActive: boolean;
  createdAt: number;
}

export default function CouponsPage() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState<CouponDoc | null>(null)
  const [page, setPage] = useState(1)

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

  const isLoading = data === undefined
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), [])

  const filtered = (data ?? []).filter((c: CouponDoc) => c.code.toLowerCase().includes(search.toLowerCase()))

  const perPage = 8
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return
    try {
      await remove({ id: id as never })
      toast.success("Coupon deleted")
    } catch (e) {
      toast.error(String(e))
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
        action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add Coupon</Button>}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by coupon code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
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
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDelete(c._id)}><Trash2 className="h-4 w-4" /></Button>
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
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editCoupon ? "Edit Coupon" : "New Coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAVE20" className="font-mono uppercase" />
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
                <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "percentage" ? "20" : "10000"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Purchase</Label>
                <Input type="number" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
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
