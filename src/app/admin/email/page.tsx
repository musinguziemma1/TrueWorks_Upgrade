"use client"

import { useState } from "react"
import { Mail, Send, TrendingUp, Users, FileText, Plus, Edit3, Copy, Trash2, Search, Filter } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function KpiCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <span className="text-xs font-semibold text-green-600">+{trend}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  )
}

interface Campaign {
  id: string; name: string; subject: string; sent: number; opened: string; clicked: string; status: string; date: string
}

const campaigns: Campaign[] = [
  { id: "1", name: "July Newsletter", subject: "New Products & Updates", sent: 2341, opened: "45%", clicked: "12%", status: "Sent", date: "2026-07-20" },
  { id: "2", name: "Flash Sale Alert", subject: "50% Off Selected Items", sent: 2200, opened: "62%", clicked: "28%", status: "Sent", date: "2026-07-15" },
  { id: "3", name: "Welcome Series #1", subject: "Welcome to TrueWorks!", sent: 180, opened: "78%", clicked: "35%", status: "Active", date: "2026-07-10" },
  { id: "4", name: "Product Launch", subject: "Introducing Admin Dashboard Kit", sent: 2341, opened: "51%", clicked: "18%", status: "Draft", date: "-" },
  { id: "5", name: "Holiday Promotion", subject: "End of Year Sale", sent: 0, opened: "-", clicked: "-", status: "Draft", date: "-" },
]

const templates = [
  { name: "Newsletter Layout", type: "HTML" },
  { name: "Promotional Email", type: "HTML" },
  { name: "Order Confirmation", type: "System" },
  { name: "Password Reset", type: "System" },
]

export default function EmailPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = campaigns.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.subject.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== "All" && c.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Marketing"
        description="Manage campaigns, templates, and subscribers"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Email Marketing" }]}
        action={
          <Button><Plus className="h-4 w-4" /> New Campaign</Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={<Users className="h-5 w-5" />} label="Subscribers" value="2,341" trend="9.8%" />
        <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Growth" value="+156" trend="7.1%" />
        <KpiCard icon={<Send className="h-5 w-5" />} label="Campaigns" value="24" trend="3" />
        <KpiCard icon={<Mail className="h-5 w-5" />} label="Open Rate" value="52.3%" trend="4.2%" />
        <KpiCard icon={<FileText className="h-5 w-5" />} label="Click Rate" value="18.7%" trend="2.1%" />
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search campaigns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1) } }}>
                <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /> <SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All", "Sent", "Active", "Draft"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
                <CardAction>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} campaigns found</span>
                </CardAction>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead className="text-center">Opened</TableHead>
                      <TableHead className="text-center">Clicked</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">{c.subject}</TableCell>
                        <TableCell className="text-center">{c.sent.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{c.opened}</TableCell>
                        <TableCell className="text-center">{c.clicked}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={c.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{c.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm"><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon-sm"><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length === 0 && (
                  <EmptyState
                    icon={<Mail className="h-12 w-12" />}
                    title="No campaigns found"
                    description="Try adjusting your search or filters to find what you're looking for."
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
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((t) => (
                <Card key={t.name} className="hover:shadow-card transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="h-32 rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center mb-3">
                      <FileText className="h-10 w-10 text-primary/40" />
                    </div>
                    <h3 className="font-medium text-sm">{t.name}</h3>
                    <Badge variant="outline" className="mt-1">{t.type}</Badge>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-dashed hover:shadow-card transition-shadow cursor-pointer">
                <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[180px]">
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">New Template</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
