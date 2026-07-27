"use client"

import { useState } from "react"
import { Users, Search, Mail, Phone, Calendar, DollarSign, ShoppingCart, MapPin, ChevronRight, Loader2, Trash2 } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  useCustomers,
  deleteCustomer,
} from "@/lib/admin-queries"

const fmtLTV = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)

interface CustomerDoc {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  lifetimeValue: number;
  newsletterSubscribed: boolean;
  createdAt: number;
  location?: string;
  avatar?: string;
}

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDoc | null>(null)
  const [page, setPage] = useState(1)

  const customers = useCustomers({ search: search || undefined })
  const removeCustomer = deleteCustomer.useMutation()

  const isLoading = customers === undefined

  const filtered = (customers ?? []).filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search)
  )

  const perPage = 8
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return
    try {
      await removeCustomer({ id: id as never })
      toast.success("Customer deleted")
      if (selectedCustomer?._id === id) setSelectedCustomer(null)
    } catch (e) {
      toast.error(String(e))
    }
  }

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customers"
        description="View and manage your customer base"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Customers" }]}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
                      <TableRow key={customer._id} className="cursor-pointer" onClick={() => setSelectedCustomer(customer as CustomerDoc)}>
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
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
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
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" /> {selectedCustomer.location ?? "—"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDelete(selectedCustomer._id)}>
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
    </div>
  )
}
