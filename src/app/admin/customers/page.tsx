"use client"

import { useState } from "react"
import { Users, Search, Mail, Phone, Calendar, DollarSign, ShoppingCart, MapPin, ChevronRight } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Customer {
  id: string; name: string; email: string; phone: string
  totalOrders: number; lifetimeValue: number; newsletter: boolean
  joinedDate: string; location: string; avatar: string
}

const customers: Customer[] = [
  { id: "1", name: "Sarah Mbabazi", email: "sarah.mbabazi@example.com", phone: "+256 712 345 678", totalOrders: 12, lifetimeValue: 1250000, newsletter: true, joinedDate: "2025-11-15", location: "Kampala, Uganda", avatar: "SM" },
  { id: "2", name: "John Okello", email: "john.okello@example.com", phone: "+256 701 234 567", totalOrders: 8, lifetimeValue: 890000, newsletter: true, joinedDate: "2026-01-20", location: "Jinja, Uganda", avatar: "JO" },
  { id: "3", name: "Grace Nabatanzi", email: "grace.nabatanzi@example.com", phone: "+256 775 123 456", totalOrders: 5, lifetimeValue: 450000, newsletter: false, joinedDate: "2026-03-10", location: "Entebbe, Uganda", avatar: "GN" },
  { id: "4", name: "David Kato", email: "david.kato@example.com", phone: "+256 702 987 654", totalOrders: 15, lifetimeValue: 2500000, newsletter: true, joinedDate: "2025-08-05", location: "Gulu, Uganda", avatar: "DK" },
  { id: "5", name: "Alice Muhwezi", email: "alice.muhwezi@example.com", phone: "+256 789 456 123", totalOrders: 3, lifetimeValue: 67000, newsletter: false, joinedDate: "2026-05-22", location: "Mbarara, Uganda", avatar: "AM" },
  { id: "6", name: "Peter Ssempijja", email: "peter.ssempijja@example.com", phone: "+256 703 567 890", totalOrders: 10, lifetimeValue: 980000, newsletter: true, joinedDate: "2025-09-14", location: "Kampala, Uganda", avatar: "PS" },
  { id: "7", name: "Susan Nalwoga", email: "susan.nalwoga@example.com", phone: "+256 772 345 678", totalOrders: 7, lifetimeValue: 550000, newsletter: true, joinedDate: "2026-02-28", location: "Mukono, Uganda", avatar: "SN" },
  { id: "8", name: "Robert Mugisha", email: "robert.mugisha@example.com", phone: "+256 706 789 123", totalOrders: 4, lifetimeValue: 210000, newsletter: false, joinedDate: "2026-06-01", location: "Fort Portal, Uganda", avatar: "RM" },
  { id: "9", name: "Faith Akello", email: "faith.akello@example.com", phone: "+256 774 567 890", totalOrders: 6, lifetimeValue: 380000, newsletter: true, joinedDate: "2025-12-12", location: "Lira, Uganda", avatar: "FA" },
]

const fmtLTV = (n: number) => new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(n)
const fmtDate = (d: string) => d

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

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
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardAction>
                <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} customers found</span>
              </CardAction>
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
                    <TableHead className="text-right">Joined</TableHead>
                    <TableHead className="text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((customer) => (
                    <TableRow key={customer.id} className="cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{customer.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                      <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                      <TableCell className="text-right">{customer.totalOrders}</TableCell>
                      <TableCell className="text-right font-medium">{fmtLTV(customer.lifetimeValue)}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={customer.newsletter ? "Subscribed" : "Unsubscribed"} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtDate(customer.joinedDate)}</TableCell>
                      <TableCell className="text-center"><ChevronRight className="h-4 w-4 text-muted-foreground inline-block" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <EmptyState
                  icon={<Users className="h-12 w-12" />}
                  title="No customers found"
                  description="Try adjusting your search to find what you're looking for."
                />
              )}
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
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
                <div className="text-center mb-4">
                  <Avatar className="h-16 w-16 mx-auto mb-3">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{selectedCustomer.avatar}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold text-primary">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5" /> {selectedCustomer.location}
                  </p>
                </div>
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><span>{selectedCustomer.email}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><span>{selectedCustomer.phone}</span></div>
                  <div className="flex items-center gap-2 text-sm"><ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" /><span>{selectedCustomer.totalOrders} orders</span></div>
                  <div className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-muted-foreground shrink-0" /><span className="font-semibold">{fmtLTV(selectedCustomer.lifetimeValue)} LTV</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground shrink-0" /><span>Joined {fmtDate(selectedCustomer.joinedDate)}</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="w-full">View Full Profile</Button>
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
