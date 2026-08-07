"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Mail, Send, TrendingUp, Users, FileText, Plus, Trash2, Search, Filter, Loader2, X } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Id } from "@convex/_generated/dataModel"

function KpiCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <span className="text-xs font-semibold text-green-600">{trend}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  )
}

interface CampaignFormData {
  name: string
  subject: string
  content: string
  status: "draft" | "scheduled" | "sent"
}

const defaultFormData: CampaignFormData = {
  name: "",
  subject: "",
  content: "",
  status: "draft",
}

export default function EmailPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<Id<"campaigns"> | null>(null)
  const [formData, setFormData] = useState<CampaignFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)
  const perPage = 8

  const campaigns = useQuery(api.campaigns.list, {})
  const stats = useQuery(api.campaigns.stats)
  const subscribers = useQuery(api.subscribers.list, {})
  const createCampaign = useMutation(api.campaigns.create)
  const updateCampaign = useMutation(api.campaigns.update)
  const deleteCampaign = useMutation(api.campaigns.remove)
  const markSent = useMutation(api.campaigns.markSent)

  const totalSubscribers = subscribers?.length ?? 0
  const activeSubscribers = subscribers?.filter((s) => s.active).length ?? 0

  const filtered = (campaigns ?? []).filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.subject.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== "All" && c.status !== statusFilter.toLowerCase()) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  function openCreateDialog() {
    setEditingId(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  function openEditDialog(campaign: typeof campaigns extends (infer T)[] | undefined ? T : never) {
    if (!campaign) return
    setEditingId(campaign._id)
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      status: campaign.status,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.subject.trim()) {
      toast.error("Name and subject are required")
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateCampaign({ id: editingId, ...formData })
        toast.success("Campaign updated")
      } else {
        await createCampaign(formData)
        toast.success("Campaign created")
      }
      setDialogOpen(false)
      setFormData(defaultFormData)
      setEditingId(null)
    } catch {
      toast.error("Failed to save campaign")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: Id<"campaigns">) {
    try {
      await deleteCampaign({ id })
      toast.success("Campaign deleted")
    } catch {
      toast.error("Failed to delete campaign")
    }
  }

  async function handleSend(id: Id<"campaigns">) {
    try {
      const count = activeSubscribers
      await markSent({ id, sentCount: count })
      toast.success(`Campaign sent to ${count} subscriber${count !== 1 ? "s" : ""}`)
    } catch {
      toast.error("Failed to send campaign")
    }
  }

  const openRate = stats && stats.totalSent > 0
    ? ((stats.totalOpened / stats.totalSent) * 100).toFixed(1) + "%"
    : "—"
  const clickRate = stats && stats.totalSent > 0
    ? ((stats.totalClicked / stats.totalSent) * 100).toFixed(1) + "%"
    : "—"

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Marketing"
        description="Manage campaigns, templates, and subscribers"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Email Marketing" }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={<Users className="h-5 w-5" />} label="Subscribers" value={totalSubscribers.toLocaleString()} trend={`${activeSubscribers} active`} />
        <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Active Subscribers" value={activeSubscribers.toLocaleString()} trend="Active" />
        <KpiCard icon={<Send className="h-5 w-5" />} label="Campaigns" value={stats?.total.toString() ?? "0"} trend={`${stats?.sent ?? 0} sent`} />
        <KpiCard icon={<Mail className="h-5 w-5" />} label="Open Rate" value={openRate} trend={`${stats?.totalOpened ?? 0} total`} />
        <KpiCard icon={<FileText className="h-5 w-5" />} label="Click Rate" value={clickRate} trend={`${stats?.totalClicked ?? 0} total`} />
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
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
                  {["All", "Sent", "Draft", "Scheduled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
                <CardAction>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} campaigns found</span>
                </CardAction>
              </CardHeader>
              <CardContent className="p-0">
                {campaigns === undefined ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : paginated.length === 0 ? (
                  <EmptyState
                    icon={<Mail className="h-12 w-12" />}
                    title="No campaigns found"
                    description="Create your first campaign to get started."
                  />
                ) : (
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
                        <TableRow key={c._id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-muted-foreground">{c.subject}</TableCell>
                          <TableCell className="text-center">{c.sentCount.toLocaleString()}</TableCell>
                          <TableCell className="text-center">{c.sentCount > 0 ? ((c.openCount / c.sentCount) * 100).toFixed(0) + "%" : "—"}</TableCell>
                          <TableCell className="text-center">{c.sentCount > 0 ? ((c.clickCount / c.sentCount) * 100).toFixed(0) + "%" : "—"}</TableCell>
                          <TableCell className="text-center"><StatusBadge status={c.status} /></TableCell>
                          <TableCell className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {c.status !== "sent" && (
                                <Button variant="ghost" size="icon-sm" title="Send campaign" onClick={() => handleSend(c._id)}><Send className="h-4 w-4" /></Button>
                              )}
                              <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(c)}><FileText className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDelete(c._id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
        </div>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Campaign" : "New Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input placeholder="e.g. July Newsletter" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input placeholder="e.g. New Products & Updates" value={formData.subject} onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea placeholder="Email content..." className="min-h-[150px]" value={formData.content} onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => { if (v) setFormData((p) => ({ ...p, status: v as CampaignFormData["status"] })) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
