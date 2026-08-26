"use client"

import { useState } from "react"
import { Users, Search, Mail, Phone, Calendar, DollarSign, ShoppingCart, ChevronRight, Trash2, FileSpreadsheet, UserCheck } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Doc } from "@convex/_generated/dataModel"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
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

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
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
  const filtered = customers ?? []

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

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customers"
        description="View and manage your customer base"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Customers" }]}
        action={
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Customers", value: customerStats?.total ?? 0, icon: Users, color: "text-[#0B2545]" },
          { label: "Newsletter Subscribers", value: customerStats?.subscribed ?? 0, icon: UserCheck, color: "text-emerald-600" },
          { label: "Total LTV", value: fmtLTV(customerStats?.totalLtv ?? 0), icon: DollarSign, color: "text-amber-600" },
          { label: "Top Customer LTV", value: fmtLTV(customerStats?.topLtv ?? 0), icon: ShoppingCart, color: "text-[#3E6990]" },
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1) }} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Customers</CardTitle>
                <CardAction><span className="text-sm text-muted-foreground">{filtered.length} customers</span></CardAction>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">LTV</TableHead>
                      <TableHead className="text-center">Newsletter</TableHead>
                      <TableHead className="text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((customer) => (
                      <TableRow key={customer._id} className="cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(customer.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                        <TableCell className="text-muted-foreground">{customer.phone ?? "—"}</TableCell>
                        <TableCell className="text-right">{customer.totalOrders}</TableCell>
                        <TableCell className="text-right font-medium">{fmtLTV(customer.lifetimeValue)}</TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={customer.newsletterSubscribed ? "Subscribed" : "Unsubscribed"} />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length === 0 && (
                  <EmptyState icon={<Users className="h-12 w-12" />} title="No customers found" description="Try adjusting your search." />
                )}
              </CardContent>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length} customers
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </div>

        <div>
          {selectedCustomer ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-center flex-1">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{getInitials(selectedCustomer.name)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold text-primary">{selectedCustomer.name}</h3>
                    {selectedCustomer.phone ? (
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                        <Phone className="h-3.5 w-3.5" /> {selectedCustomer.phone}
                      </p>
                    ) : null}
                  </div>
                  <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteTarget(selectedCustomer)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><span>{selectedCustomer.email}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><span>{selectedCustomer.phone ?? "—"}</span></div>
                  <div className="flex items-center gap-2 text-sm"><ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" /><span>{selectedCustomer.totalOrders} orders</span></div>
                  <div className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-muted-foreground shrink-0" /><span className="font-semibold">{fmtLTV(selectedCustomer.lifetimeValue)} LTV</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground shrink-0" /><span>Joined {new Date(selectedCustomer.createdAt).toLocaleDateString("en-UG")}</span></div>
                </div>
                <div className="border-t border-border pt-3 mt-4">
                  <p className="text-sm font-medium mb-2">Recent Orders</p>
                  {customerOrders === undefined ? (
                    <p className="text-xs text-muted-foreground py-2">Loading...</p>
                  ) : customerOrders.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No orders yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {customerOrders.map((o) => (
                        <div key={o._id} className="flex items-center justify-between text-xs rounded-md border border-border/70 bg-surface px-2.5 py-1.5">
                          <span className="font-medium">{o.orderNumber}</span>
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <StatusBadge status={o.paymentStatus === "completed" ? "Paid" : o.paymentStatus} />
                            {fmtLTV(o.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Select a customer to view details</p>
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
