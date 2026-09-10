"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  AlertCircle,
  Radio,
  Zap,
  ArrowRight,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { cn } from "@/lib/utils"
import { useAuditState } from "./use-audit-state"
import type { AuditTab } from "./use-audit-state"
import { StatCards } from "./_components/stat-cards"
import { TrendChart } from "./_components/trend-chart"
import { Breakdowns } from "./_components/breakdowns"
import { FilterBar } from "./_components/filter-bar"
import { ActivityTable } from "./_components/activity-table"
import { ErrorsPanel } from "./_components/errors-panel"
import { PerformancePanel } from "./_components/performance-panel"
import { DetailDialog } from "./_components/detail-dialog"
import { ExportButton } from "./_components/export-button"
import { RetentionCard } from "./_components/retention-card"
import type { AuditLog } from "./types"

const TAB_ITEMS = [
  { value: "all" as const, label: "All Events", icon: Activity },
  { value: "errors" as const, label: "Errors", icon: AlertCircle },
  { value: "performance" as const, label: "Performance", icon: Zap },
]

export default function AuditLogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const state = useAuditState()
  const { setTotal } = state

  const initialTab = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<AuditTab>(
    initialTab === "errors" || initialTab === "performance" ? initialTab : "all"
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTab !== "all") params.set("tab", activeTab)
    const qs = params.toString()
    router.replace(
      qs ? `/admin/audit?${qs}` : "/admin/audit",
      { scroll: false }
    )
  }, [activeTab, router])

  const stats = useQuery(api.auditLogs.stats, { days: state.days })

  const events = useQuery(api.auditLogs.list, {
    entityType: state.entity !== "all" ? state.entity : undefined,
    action: state.action !== "all" ? state.action : undefined,
    level: state.level !== "all" ? state.level : undefined,
    levels: activeTab === "errors" ? ["error", "critical"] : undefined,
    source: state.source !== "all" ? state.source : undefined,
    actorEmail: state.actor !== "all" ? state.actor : undefined,
    search: state.debouncedSearch || undefined,
    days: state.days,
    limit: state.pageSize,
    offset: (state.page - 1) * state.pageSize,
  }) ?? { logs: [], total: 0 }

  useEffect(() => {
    setTotal(events.total)
  }, [events.total, setTotal])

  const loadingStats = stats === undefined
  const loadingEvents = events.logs.length === 0 && events.total === 0

  const entities = Object.keys(stats?.byEntity ?? {}).sort()
  const actions = Object.keys(stats?.byAction ?? {}).sort()
  const actors = Object.keys(stats?.byActor ?? {}).sort()

  const handleOpen = (log: AuditLog) => state.setDetailLog(log)
  const handleOpenSlowOp = (op: unknown) =>
    state.setDetailLog(op as AuditLog)

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
              <a
                href="/admin"
                className="transition-colors hover:text-white/80"
              >
                Dashboard
              </a>
              <ArrowRight className="h-3 w-3" />
              <span className="text-white/70">Audit & System Health</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Audit & System Health
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Track all system changes, user actions, performance metrics, and
              errors
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-white/50 sm:flex">
              <Radio className="h-3.5 w-3.5 text-emerald-400" />
              Live updates
            </span>
            <ExportButton
              state={state}
              disabled={loadingStats && loadingEvents}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatCards stats={stats} loading={loadingStats} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendChart stats={stats} loading={loadingStats} />
        </div>
        <div className="xl:col-span-1">
          <Breakdowns
            stats={stats}
            loading={loadingStats}
            onSelectAction={(a) => state.setAction(a)}
            onSelectActor={(a) => state.setActor(a)}
          />
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        state={state}
        entities={entities}
        actions={actions}
        actors={actors}
      />

      {/* Gold Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AuditTab)}
      >
        <div className="rounded-2xl border border-border/70 bg-white p-1 shadow-card">
          <TabsList className="h-auto gap-1 bg-transparent p-0">
            {TAB_ITEMS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  "data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.value === "errors" &&
                  (stats?.errorCount ?? 0) > 0 && (
                    <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                      {stats!.errorCount}
                    </span>
                  )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4">
          <TabsContent value="all">
            <ActivityTable
              logs={events.logs}
              total={events.total}
              page={state.page}
              pageSize={state.pageSize}
              loading={loadingEvents}
              onPageChange={state.setPage}
              onPageSizeChange={state.setPageSize}
              onOpen={handleOpen}
            />
          </TabsContent>
          <TabsContent value="errors">
            <ErrorsPanel
              logs={events.logs}
              total={events.total}
              loading={loadingEvents}
              onOpen={handleOpen}
            />
          </TabsContent>
          <TabsContent value="performance">
            <PerformancePanel
              slowOps={stats?.slowOps ?? []}
              p50={stats?.p50LatencyMs ?? 0}
              p95={stats?.p95LatencyMs ?? 0}
              p99={stats?.p99LatencyMs ?? 0}
              total={stats?.slowOpsCount ?? 0}
              loading={loadingStats}
              onOpen={handleOpenSlowOp}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Retention */}
      <RetentionCard />

      {/* Detail Dialog */}
      <DetailDialog
        log={state.detailLog}
        onClose={() => state.setDetailLog(null)}
      />
    </div>
  )
}
