"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  FilterX,
  Plus,
  Search,
  Users,
  Mail,
  ArrowRight,
  BarChart3,
} from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useEmailState } from "./use-email-state"
import { StatCards } from "./_components/stat-cards"
import { EngagementChart } from "./_components/engagement-chart"
import { CampaignsTable } from "./_components/campaigns-table"
import { SubscribersTable } from "./_components/subscribers-table"
import {
  CampaignEditor,
  type CampaignFormData,
} from "./_components/campaign-editor"
import {
  DeleteCampaignDialog,
  RemoveSubscriberDialog,
  SendCampaignDialog,
} from "./_components/confirm-dialogs"
import {
  CampaignsExportButton,
  SubscribersExportButton,
} from "./_components/export-buttons"
import { EmailTemplateManager } from "./_components/email-template-manager"
import type { Campaign, Subscriber } from "./types"

const TAB_ITEMS = [
  { value: "campaigns", label: "Campaigns", icon: Mail },
  { value: "subscribers", label: "Subscribers", icon: Users },
  { value: "templates", label: "Templates", icon: Mail },
] as const

export default function EmailPage() {
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(
    requestedTab === "templates" || requestedTab === "subscribers"
      ? requestedTab
      : "campaigns"
  )
  const state = useEmailState()
  const { setCampaignTotal, setSubscriberTotal } = state

  const stats = useQuery(api.campaigns.stats)

  const campaignsResult = useQuery(api.campaigns.list, {
    search: state.debouncedSearch || undefined,
    status:
      state.campaignStatus !== "all"
        ? (state.campaignStatus as Campaign["status"])
        : undefined,
    limit: state.campaignPageSize,
    offset: (state.campaignPage - 1) * state.campaignPageSize,
  })
  const campaignsData = campaignsResult ?? { campaigns: [], total: 0 }

  const subscribersResult = useQuery(api.subscribers.listPage, {
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
  const [editorInitial, setEditorInitial] = useState<
    CampaignFormData | undefined
  >(undefined)
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
      toast.error(
        error instanceof Error ? error.message : "Failed to save campaign"
      )
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
      toast.error(
        error instanceof Error ? error.message : "Failed to send campaign"
      )
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
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#0F3058] px-6 py-8 lg:px-8 lg:py-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
              <a href="/admin" className="transition-colors hover:text-white/80">
                Dashboard
              </a>
              <ArrowRight className="h-3 w-3" />
              <span className="text-white/70">Email Marketing</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Email Marketing
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Create campaigns, schedule sends, and track open and click engagement
            </p>
          </div>
          <Button
            size="sm"
            className="bg-accent text-primary-dark hover:bg-accent/90"
            onClick={openNew}
          >
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>
      </section>

      {/* Stats */}
      <StatCards stats={stats} loading={loadingStats} />

      {/* Engagement Chart */}
      <EngagementChart stats={stats} loading={loadingStats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <div className="rounded-2xl border border-border/70 bg-white p-1 shadow-card">
          <TabsList className="h-auto gap-1 bg-transparent p-0">
            {TAB_ITEMS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="campaigns" className="mt-4 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns by name or subject..."
                value={state.search}
                onChange={(e) => state.setSearch(e.target.value)}
                className="h-10 pl-10 pr-9"
              />
              {state.search && (
                <button
                  onClick={() => state.setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            <Select
              value={state.campaignStatus}
              onValueChange={(v) => v && state.setCampaignStatus(v)}
            >
              <SelectTrigger className="h-10 w-full sm:w-[160px]">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={state.resetCampaignFilters}
              >
                <FilterX className="mr-2 h-4 w-4" /> Clear
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
          {/* Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subscribers by email or name..."
                value={state.search}
                onChange={(e) => state.setSearch(e.target.value)}
                className="h-10 pl-10 pr-9"
              />
              {state.search && (
                <button
                  onClick={() => state.setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            <Select
              value={state.subscriberActive}
              onValueChange={(v) => v && state.setSubscriberActive(v)}
            >
              <SelectTrigger className="h-10 w-full sm:w-[160px]">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={state.resetSubscriberFilters}
              >
                <FilterX className="mr-2 h-4 w-4" /> Clear
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
