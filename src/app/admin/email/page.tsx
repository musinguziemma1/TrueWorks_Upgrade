"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { FilterX, Plus, Search, Users, Mail } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useEmailState } from "./use-email-state"
import { StatCards } from "./_components/stat-cards"
import { EngagementChart } from "./_components/engagement-chart"
import { CampaignsTable } from "./_components/campaigns-table"
import { SubscribersTable } from "./_components/subscribers-table"
import { CampaignEditor, type CampaignFormData } from "./_components/campaign-editor"
import { DeleteCampaignDialog, RemoveSubscriberDialog, SendCampaignDialog } from "./_components/confirm-dialogs"
import { CampaignsExportButton, SubscribersExportButton } from "./_components/export-buttons"
import { EmailTemplateManager } from "./_components/email-template-manager"
import type { Campaign, Subscriber } from "./types"

export default function EmailPage() {
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(
    requestedTab === "templates" || requestedTab === "subscribers" ? requestedTab : "campaigns"
  )
  const state = useEmailState()
  const { setCampaignTotal, setSubscriberTotal } = state

  const stats = useQuery(api.campaigns.stats)

  const campaignsResult =
    useQuery(api.campaigns.list, {
      search: state.debouncedSearch || undefined,
      status: state.campaignStatus !== "all" ? (state.campaignStatus as Campaign["status"]) : undefined,
      limit: state.campaignPageSize,
      offset: (state.campaignPage - 1) * state.campaignPageSize,
    })
  const campaignsData = campaignsResult ?? { campaigns: [], total: 0 }

  const subscribersResult =
    useQuery(api.subscribers.listPage, {
      search: state.debouncedSearch || undefined,
      activeOnly: state.subscriberActive === "active" ? true : undefined,
      limit: state.subscriberPageSize,
      offset: (state.subscriberPage - 1) * state.subscriberPageSize,
    })
  const subscribersData = subscribersResult ?? { subscribers: [], total: 0 }

  useEffect(() => {
    setCampaignTotal(campaignsData.total)
  }, [campaignsData.total, setCampaignTotal])

  useEffect(() => {
    setSubscriberTotal(subscribersData.total)
  }, [subscribersData.total, setSubscriberTotal])

  const createCampaign = useMutation(api.campaigns.create)
  const updateCampaign = useMutation(api.campaigns.update)
  const duplicateCampaign = useMutation(api.campaigns.duplicate)
  const deleteCampaign = useMutation(api.campaigns.remove)
  const sendCampaign = useMutation(api.campaigns.send)
  const removeSubscriber = useMutation(api.subscribers.remove)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorCampaign, setEditorCampaign] = useState<Campaign | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [editorInitial, setEditorInitial] = useState<CampaignFormData | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  const [sendTarget, setSendTarget] = useState<Campaign | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Subscriber | null>(null)
  const [busy, setBusy] = useState(false)

  const loadingStats = stats === undefined
  const loadingCampaigns = campaignsResult === undefined
  const loadingSubscribers = subscribersResult === undefined

  const openNew = () => {
    setEditorCampaign(null)
    setEditorInitial({
      name: "",
      subject: "",
      content: "",
      status: "draft",
    })
    setEditorKey((k) => k + 1)
    setEditorOpen(true)
  }

  const openEdit = (c: Campaign) => {
    setEditorCampaign(c)
    setEditorInitial({
      name: c.name,
      subject: c.subject,
      content: c.content,
      status: c.status === "scheduled" ? "scheduled" : "draft",
      scheduledAt: c.scheduledAt ?? Date.now() + 24 * 60 * 60 * 1000,
    })
    setEditorKey((k) => k + 1)
    setEditorOpen(true)
  }

  const runEditorSave = async (data: CampaignFormData, sendAfter: boolean) => {
    if (!data.name.trim() || !data.subject.trim()) {
      toast.error("Name and subject are required")
      return
    }
    if (data.status === "scheduled" && !data.scheduledAt) {
      toast.error("Pick a send time for a scheduled campaign")
      return
    }
    setSaving(true)
    try {
      if (editorCampaign) {
        await updateCampaign({
          id: editorCampaign._id,
          name: data.name,
          subject: data.subject,
          content: data.content,
          status: data.status,
          scheduledAt: data.scheduledAt,
        })
        if (sendAfter) {
          await sendCampaign({ id: editorCampaign._id })
          toast.success("Campaign updated and queued for sending")
        } else {
          toast.success("Campaign updated")
        }
      } else {
        const id = await createCampaign({
          name: data.name,
          subject: data.subject,
          content: data.content,
          status: data.status,
          scheduledAt: data.scheduledAt,
        })
        if (sendAfter) {
          await sendCampaign({ id })
          toast.success("Campaign created and queued for sending")
        } else {
          toast.success("Campaign created")
        }
      }
      setEditorOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save campaign")
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async (c: Campaign) => {
    try {
      await duplicateCampaign({ id: c._id })
      toast.success(`Duplicated "${c.name}"`)
    } catch {
      toast.error("Failed to duplicate campaign")
    }
  }

  const confirmSend = async () => {
    if (!sendTarget) return
    setBusy(true)
    try {
      await sendCampaign({ id: sendTarget._id })
      toast.success(`"${sendTarget.name}" queued for sending`)
      setSendTarget(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send campaign")
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteCampaign({ id: deleteTarget._id })
      toast.success("Campaign deleted")
      setDeleteTarget(null)
    } catch {
      toast.error("Failed to delete campaign")
    } finally {
      setBusy(false)
    }
  }

  const confirmRemoveSubscriber = async () => {
    if (!removeTarget) return
    setBusy(true)
    try {
      await removeSubscriber({ id: removeTarget._id })
      toast.success("Subscriber removed")
      setRemoveTarget(null)
    } catch {
      toast.error("Failed to remove subscriber")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Marketing"
        description="Create campaigns, schedule sends, and track open and click engagement."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Email Marketing" }]}
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Button>
        }
      />

      <StatCards stats={stats} loading={loadingStats} />

      <EngagementChart stats={stats} loading={loadingStats} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="subscribers">
            <Users className="h-4 w-4 mr-1.5" /> Subscribers
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Mail className="h-4 w-4 mr-1.5" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns by name or subject…"
                value={state.search}
                onChange={(e) => state.setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={state.campaignStatus} onValueChange={(v) => v && state.setCampaignStatus(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
            <CampaignsExportButton
              search={state.debouncedSearch}
              status={state.campaignStatus}
              disabled={loadingCampaigns}
            />
            {state.hasCampaignFilters && (
              <Button variant="ghost" size="sm" onClick={state.resetCampaignFilters}>
                <FilterX className="h-4 w-4 mr-2" /> Clear
              </Button>
            )}
          </div>

          <CampaignsTable
            campaigns={campaignsData.campaigns}
            total={campaignsData.total}
            page={state.campaignPage}
            pageSize={state.campaignPageSize}
            loading={loadingCampaigns}
            onPageChange={state.setCampaignPage}
            onPageSizeChange={state.setCampaignPageSize}
            onEdit={openEdit}
            onDuplicate={handleDuplicate}
            onSend={setSendTarget}
            onDelete={setDeleteTarget}
          />
        </TabsContent>

        <TabsContent value="subscribers" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subscribers by email or name…"
                value={state.search}
                onChange={(e) => state.setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={state.subscriberActive} onValueChange={(v) => v && state.setSubscriberActive(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
              </SelectContent>
            </Select>
            <SubscribersExportButton
              search={state.debouncedSearch}
              activeOnly={state.subscriberActive === "active"}
              disabled={loadingSubscribers}
            />
            {state.hasSubscriberFilters && (
              <Button variant="ghost" size="sm" onClick={state.resetSubscriberFilters}>
                <FilterX className="h-4 w-4 mr-2" /> Clear
              </Button>
            )}
          </div>

          <SubscribersTable
            subscribers={subscribersData.subscribers}
            total={subscribersData.total}
            page={state.subscriberPage}
            pageSize={state.subscriberPageSize}
            loading={loadingSubscribers}
            onPageChange={state.setSubscriberPage}
            onPageSizeChange={state.setSubscriberPageSize}
            onRemove={setRemoveTarget}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <EmailTemplateManager />
        </TabsContent>
      </Tabs>

      {editorOpen && (
        <CampaignEditor
          key={editorKey}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          campaign={editorCampaign}
          initial={editorInitial}
          saving={saving}
          onSave={(data) => runEditorSave(data, false)}
          onSaveAndSend={(data) => runEditorSave(data, true)}
        />
      )}

      <SendCampaignDialog
        open={sendTarget !== null}
        onOpenChange={(open) => !open && setSendTarget(null)}
        campaign={sendTarget}
        recipientCount={stats?.activeSubscribers ?? 0}
        busy={busy}
        onConfirm={confirmSend}
      />

      <DeleteCampaignDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        campaign={deleteTarget}
        busy={busy}
        onConfirm={confirmDelete}
      />

      <RemoveSubscriberDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        email={removeTarget?.email ?? null}
        busy={busy}
        onConfirm={confirmRemoveSubscriber}
      />
    </div>
  )
}
