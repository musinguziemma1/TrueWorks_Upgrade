"use client"

import { useEffect } from "react"
import { Activity, AlertCircle, Radio, Zap } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useAuditState } from "./use-audit-state"
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

export default function AuditLogPage() {
  const state = useAuditState()
  const { setTotal } = state

  const stats = useQuery(api.auditLogs.stats, { days: state.days })

  const events = useQuery(api.auditLogs.list, {
    entityType: state.entity !== "all" ? state.entity : undefined,
    action: state.action !== "all" ? state.action : undefined,
    level: state.level !== "all" ? state.level : undefined,
    levels: state.tab === "errors" ? ["error", "critical"] : undefined,
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

  // Filter dropdown options, derived from the window stats so they're complete.
  const entities = Object.keys(stats?.byEntity ?? {}).sort()
  const actions = Object.keys(stats?.byAction ?? {}).sort()
  const actors = Object.keys(stats?.byActor ?? {}).sort()

  const handleOpen = (log: AuditLog) => state.setDetailLog(log)
  const handleOpenSlowOp = (op: unknown) => state.setDetailLog(op as AuditLog)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit & System Health"
        description="Track all system changes, user actions, performance metrics, and errors."
        action={
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Radio className="h-3.5 w-3.5 text-emerald-600" />
              Live updates
            </span>
            <ExportButton state={state} disabled={loadingStats && loadingEvents} />
          </div>
        }
      />

      <StatCards stats={stats} loading={loadingStats} />

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

      <FilterBar state={state} entities={entities} actions={actions} actors={actors} />

      <Tabs value={state.tab} onValueChange={(v) => state.setTab(v as typeof state.tab)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">
            <Activity className="h-4 w-4" />
            All Events
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertCircle className="h-4 w-4" />
            Errors
            {(stats?.errorCount ?? 0) > 0 && (
              <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0 text-[10px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                {stats!.errorCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
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
            <ErrorsPanel logs={events.logs} total={events.total} loading={loadingEvents} onOpen={handleOpen} />
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

      <RetentionCard />

      <DetailDialog log={state.detailLog} onClose={() => state.setDetailLog(null)} />
    </div>
  )
}
