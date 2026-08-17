"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { KeyRound, ShieldAlert, Loader2, Copy, Check, FileSpreadsheet, CheckCircle2, Activity } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { downloadCsv, toCsv } from "@/lib/csv"
import { toast } from "sonner"

export default function LicensesPage() {
  const [search, setSearch] = useState("")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const licenses = useQuery(api.licenses.listAll, { search: search || undefined })
  const licenseStats = useQuery(api.licenses.stats)
  const revoke = useMutation(api.licenses.revoke)

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    })
  }

  const handleRevoke = (id: string) => {
    const license = licenses?.find((l) => l._id === id)
    const action = license?.status === "revoked" ? "restore" : "revoke"
    if (!confirm(`Are you sure you want to ${action} this license?`)) return
    revoke({ id: id as never }).then(() => toast.success(action === "revoke" ? "License revoked" : "License restored"))
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Licenses"
        description="Manage issued license keys"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Licenses" }]}
        action={
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={licenses?.length === 0}>
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Keys", value: licenseStats?.total ?? 0, icon: KeyRound, color: "text-[#0B2545]" },
          { label: "Active", value: licenseStats?.active ?? 0, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Revoked", value: licenseStats?.revoked ?? 0, icon: ShieldAlert, color: "text-red-600" },
          { label: "Activations", value: `${licenseStats?.activations ?? 0}/${licenseStats?.capacity ?? 0}`, icon: Activity, color: "text-[#3E6990]" },
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
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by key, product or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>License Records</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{licenses?.length ?? 0} records</span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {licenses === undefined ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : licenses.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="h-12 w-12" />}
              title="No license keys"
              description="License keys are auto-issued on purchase for products with license-gating enabled."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Activations</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((l) => (
                  <TableRow key={l._id}>
                    <TableCell className="font-mono text-xs">
                      <span className="inline-flex items-center gap-1">
                        {l.key}
                        <Button variant="ghost" size="icon-sm" title="Copy key" onClick={() => copyKey(l.key)}>
                          {copiedKey === l.key ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{l.productName}</TableCell>
                    <TableCell>{l.email}</TableCell>
                    <TableCell className="text-center">{l.activations} / {l.maxActivations}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={l.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={l.status === "revoked" ? "Restore license" : "Revoke license"}
                          onClick={() => handleRevoke(l._id)}
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}