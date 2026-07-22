"use client"

import { useState } from "react"
import { Plus, Edit3, Trash2, Search, Ticket } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Coupon {
  id: string; code: string; type: string; value: string; usage: string; minPurchase: string; expires: string; status: "Active" | "Expired" | "Disabled"
}

const initialCoupons: Coupon[] = [
  { id: "1", code: "WELCOME20", type: "Percentage", value: "20%", usage: "45/100", minPurchase: "UGX 50,000", expires: "2026-12-31", status: "Active" },
  { id: "2", code: "SAVE10K", type: "Fixed", value: "UGX 10,000", usage: "23/50", minPurchase: "UGX 100,000", expires: "2026-09-30", status: "Active" },
  { id: "3", code: "BUNDLE15", type: "Percentage", value: "15%", usage: "12/30", minPurchase: "UGX 200,000", expires: "2026-08-15", status: "Active" },
  { id: "4", code: "FREESHIP", type: "Fixed", value: "UGX 0", usage: "67/200", minPurchase: "UGX 150,000", expires: "2026-07-01", status: "Expired" },
  { id: "5", code: "VIP50", type: "Percentage", value: "50%", usage: "3/10", minPurchase: "UGX 500,000", expires: "2026-11-30", status: "Active" },
  { id: "6", code: "OLDCODE", type: "Percentage", value: "10%", usage: "100/100", minPurchase: "UGX 30,000", expires: "2026-06-01", status: "Disabled" },
]

export default function CouponsPage() {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()))

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleDelete = (id: string) => setCoupons(coupons.filter((c) => c.id !== id))

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Coupons"
        description="Manage discount coupons and promotions"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Coupons" }]}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button><Plus className="h-4 w-4" /> Add Coupon</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>New Coupon</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Coupon Code</Label>
                  <Input placeholder="e.g. SAVE20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="bundle">Bundle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input placeholder="e.g. 20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Purchase</Label>
                    <Input placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Usage Limit</Label>
                    <Input placeholder="Unlimited" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch defaultChecked />
                </div>
              </div>
              <DialogFooter showCloseButton>
                <Button onClick={() => setDialogOpen(false)}>Save Coupon</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by coupon code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupons</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} coupons found</span>
          </CardAction>
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
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                  <TableCell className="font-medium">{c.value}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{c.usage}</TableCell>
                  <TableCell className="text-muted-foreground">{c.minPurchase}</TableCell>
                  <TableCell className="text-muted-foreground">{c.expires}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={c.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm"><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<Ticket className="h-12 w-12" />}
              title="No coupons found"
              description="Try adjusting your search to find what you're looking for."
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
