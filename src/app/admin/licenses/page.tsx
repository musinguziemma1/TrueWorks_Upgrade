"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import {
  KeyRound,
  Copy,
  Check,
  FileSpreadsheet,
  ShieldAlert,
  RotateCcw,
  Activity,
  Loader2,
  Plus,
} from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { StatCard } from "@/components/admin/stat-card"
import { downloadCsv, toCsv } from "@/lib/csv"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "revoked", label: "Revoked" },
] as const

type Filter = (typeof FILTERS)[number]["key"]

function activationTone(pct: number) {
  if (pct >= 100) return "bg-red-500"
  if (pct >= 80) return "bg-amber-500"
  return "bg-emerald-500"
}

export default function LicensesPage() {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
  const [filter, setFilter] = useState<Filter>("all")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<Id<"licenses"> | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)

  const licenses = useQuery(api.licenses.listAll, { search: search || undefined })
  const licenseStats = useQuery(api.licenses.stats)
  const products = useQuery(api.products.list, { limit: 100 })
  const revokeMutation = useMutation(api.licenses.revoke)
  const issueManual = useMutation(api.licenses.issueManual)

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key)
      toast.success("License key copied")
      setTimeout(() => setCopiedKey(null), 1500)
    })
  }

  const filtered = useMemo(() => {
    const rows = licenses ?? []
    if (filter === "all") return rows
    return rows.filter((l) => l.status === filter)
  }, [licenses, filter])

  const target = confirmId ? licenses?.find((l) => l._id === confirmId) : undefined

  const handleRevokeToggle = async () => {
    if (!confirmId) return
    try {
      setToggling(confirmId)
      await revokeMutation({ id: confirmId })
      toast.success(target?.status === "revoked" ? "License restored" : "License revoked")
    } catch (e) {
      toast.error(String(e))
    } finally {
      setToggling(null)
      setConfirmId(null)
    }
  }

  const handleExportCsv = () => {
    const csv = toCsv(
      (licenses ?? []).map((l) => ({
        key: l.key,
        product: l.productName,
        email: l.email,
        activations: l.activations,
        maxActivations: l.maxActivations,
        status: l.status,
        issued: new Date(l.createdAt).toISOString().slice(0, 10),
      }))
    )
    downloadCsv(`licenses-${new Date().toISOString().slice(0, 10)}`, csv)
  }

  const isLoading = licenses === undefined

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Licenses"
        description="Manage issued license keys across your digital products"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Licenses" }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={licenses?.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => setIssueDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Issue License
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Keys" value={licenseStats?.total ?? 0} icon={KeyRound} tint="text-primary bg-primary/10" loading={isLoading} />
        <StatCard label="Active" value={licenseStats?.active ?? 0} icon={Activity} tint="text-emerald-700 bg-emerald-50" loading={isLoading} />
        <StatCard label="Revoked" value={licenseStats?.revoked ?? 0} icon={ShieldAlert} tint="text-red-700 bg-red-50" loading={isLoading} />
        <StatCard label="Activations" value={`${licenseStats?.activations ?? 0}/${licenseStats?.capacity ?? 0}`} icon={RotateCcw} tint="text-secondary bg-secondary/10" footnote="Seats used / capacity" loading={isLoading} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by key, product or email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
<Card>
        <CardHeader>
          <CardTitle>License Records</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              {filtered.length} {filter === "all" ? "records" : `${filter} keys`}
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="h-12 w-12" />}
              title="No license keys"
              description="License keys are auto-issued on purchase for products with license-gating enabled."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">Key</TableHead>
                    <TableHead className="text-primary">Product</TableHead>
                    <TableHead className="text-primary">Customer</TableHead>
                    <TableHead className="text-primary">Activations</TableHead>
                    <TableHead className="text-primary">Issued</TableHead>
                    <TableHead className="text-center text-primary">Status</TableHead>
                    <TableHead className="text-right text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const pct = l.maxActivations ? Math.round((l.activations / l.maxActivations) * 100) : 0
                    return (
                      <TableRow key={l._id} className="transition-colors hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">
                          <span className="inline-flex items-center gap-1">
                            {l.key}
                            <Button variant="ghost" size="icon-xs" title="Copy key" onClick={() => copyKey(l.key)}>
                              {copiedKey === l.key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{l.productName}</TableCell>
                        <TableCell>{l.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full transition-all", activationTone(pct))}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">{l.activations}/{l.maxActivations}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={l.status} /></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={l.status === "revoked" ? "Restore license" : "Revoke license"}
                              onClick={() => setConfirmId(l._id)}
                              disabled={toggling === l._id}
                            >
                              {toggling === l._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : l.status === "revoked" ? (
                                <RotateCcw className="h-4 w-4" />
                              ) : (
                                <ShieldAlert className="h-4 w-4" />
                              )}
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

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(open) => { if (!open) setConfirmId(null) }}
        title={target?.status === "revoked" ? "Restore this license?" : "Revoke this license?"}
        description={target?.status === "revoked"
          ? "The customer will be able to activate this key again. This action can be undone."
          : "This immediately invalidates the key. The customer will no longer be able to activate the product. This action can be undone."}
        confirmLabel={target?.status === "revoked" ? "Restore license" : "Revoke license"}
        destructive={target?.status !== "revoked"}
        onConfirm={handleRevokeToggle}
      />

      <IssueLicenseDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        products={products?.items ?? []}
        issueManual={issueManual}
        onIssued={(key) => {
          setIssueDialogOpen(false)
          setCopiedKey(key)
          setTimeout(() => setCopiedKey(null), 3000)
        }}
      />
    </div>
  )
}

function IssueLicenseDialog({
  open,
  onOpenChange,
  products,
  issueManual,
  onIssued,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Array<{ _id: Id<"products">; name: string; activationLimit?: number }>
  issueManual: (args: { productId: Id<"products">; email: string; maxActivations?: number }) => Promise<{ key: string; id: Id<"licenses"> }>
  onIssued: (key: string) => void
}) {
  const [productId, setProductId] = useState<Id<"products"> | "">("")
  const [email, setEmail] = useState("")
  const [maxActivations, setMaxActivations] = useState("")
  const [issuing, setIssuing] = useState(false)
  const [issuedKey, setIssuedKey] = useState<string | null>(null)

  const selectedProduct = products.find((p) => p._id === productId)

  const handleIssue = async () => {
    if (!productId || !email) {
      toast.error("Product and email are required")
      return
    }
    setIssuing(true)
    try {
      const result = await issueManual({
        productId: productId as Id<"products">,
        email,
        maxActivations: maxActivations ? Number(maxActivations) : undefined,
      })
      setIssuedKey(result.key)
      onIssued(result.key)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to issue license")
    } finally {
      setIssuing(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setProductId("")
    setEmail("")
    setMaxActivations("")
    setIssuedKey(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue License Key</DialogTitle>
        </DialogHeader>
        {issuedKey ? (
          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <KeyRound className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-emerald-800">License key generated</p>
              <p className="mt-2 font-mono text-lg font-bold text-emerald-900">{issuedKey}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(issuedKey)
                  toast.success("Copied to clipboard")
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Key
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product *</Label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value as Id<"products">)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Customer Email *</Label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Activations</Label>
              <Input
                type="number"
                min="1"
                placeholder={selectedProduct?.activationLimit?.toString() ?? "1"}
                value={maxActivations}
                onChange={(e) => setMaxActivations(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use product default ({selectedProduct?.activationLimit ?? 1})
              </p>
            </div>
          </div>
        )}
        {!issuedKey && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={issuing}>
              Cancel
            </Button>
            <Button onClick={handleIssue} disabled={issuing || !productId || !email}>
              {issuing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Issue Key
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}