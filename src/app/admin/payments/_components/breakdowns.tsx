"use client"

import { Cell, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip } from "recharts"
import { BarChart3, Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { CHART_COLORS, methodLabel, providerLabel, statusMeta } from "../lib/format"
import type { StatsResult } from "../types"

const STATUS_ORDER = ["completed", "pending", "failed", "refunded"] as const
const STATUS_BAR_COLORS: Record<string, string> = {
  completed: "bg-emerald-500",
  pending: "bg-amber-500",
  failed: "bg-red-500",
  refunded: "bg-muted-foreground",
}

function ProgressList({
  data,
  renderLabel,
  emptyLabel,
}: {
  data: [string, number][]
  renderLabel: (key: string) => string
  emptyLabel: string
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }
  const max = data[0][1] || 1
  return (
    <div className="space-y-2.5">
      {data.slice(0, 6).map(([key, count]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium">{renderLabel(key)}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {count.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProviderDonut({ providers }: { providers: [string, number][] }) {
  if (providers.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="h-8 w-8" />}
        title="No providers yet"
        description="Provider data will appear here once payments start flowing in."
      />
    )
  }

  return (
    <div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={providers.map(([name, value]) => ({ name: providerLabel(name), value }))}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={3}
              stroke="var(--background)"
            >
              {providers.map(([, ], i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--popover-foreground)",
                boxShadow: "0 4px 12px -2px rgba(0,0,0,0.12)",
              }}
              formatter={(value, name) => [`${Number(value).toLocaleString()} txns`, name]}
            />
          </RePieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {providers.map(([name, count], i) => (
          <span key={name} className="inline-flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="font-medium">{providerLabel(name)}</span>
            <span className="text-muted-foreground tabular-nums">{count.toLocaleString()}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function StatusBars({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = STATUS_ORDER
    .map((s) => [s, byStatus[s] ?? 0] as [string, number])
    .filter(([, count]) => count > 0)

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-8 w-8" />}
        title="No status data"
        description="Status counts will appear here once payments are recorded."
      />
    )
  }

  const maxStatus = Math.max(1, ...entries.map(([, c]) => c))
  return (
    <div className="space-y-3">
      {entries.map(([s, count]) => {
        const meta = statusMeta(s)
        return (
          <div key={s} className="flex items-center gap-3">
            <span
              className={`inline-flex w-24 shrink-0 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className={`h-full rounded-full ${STATUS_BAR_COLORS[s] ?? "bg-primary"} transition-all`}
                style={{ width: `${(count / maxStatus) * 100}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {count.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function Breakdowns({ stats, loading }: { stats?: StatsResult; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-3 h-9 w-full" />
          <Skeleton className="h-[220px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const providers = Object.entries(stats?.byProvider ?? {}).sort((a, b) => b[1] - a[1])
  const methods = Object.entries(stats?.byMethod ?? {}).sort((a, b) => b[1] - a[1])
  const byStatus = stats?.byStatus ?? {}

  const hasProviders = providers.length > 0
  const hasMethods = methods.length > 0
  const hasStatus = Object.keys(byStatus).length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Layers className="h-3.5 w-3.5" />
          </span>
          <CardTitle>Breakdowns</CardTitle>
        </div>
        <CardDescription>
          {hasProviders || hasMethods || hasStatus
            ? "Where your payments are coming from and how they're settling."
            : "No data in this period."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={hasProviders ? "providers" : hasMethods ? "methods" : "status"}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="providers" className="flex-1">
              Providers
            </TabsTrigger>
            <TabsTrigger value="methods" className="flex-1">
              Methods
            </TabsTrigger>
            <TabsTrigger value="status" className="flex-1">
              Status
            </TabsTrigger>
          </TabsList>
          <TabsContent value="providers">
            <ProviderDonut providers={providers} />
          </TabsContent>
          <TabsContent value="methods">
            <ProgressList
              data={methods}
              renderLabel={methodLabel}
              emptyLabel="No payment methods yet."
            />
          </TabsContent>
          <TabsContent value="status">
            <StatusBars byStatus={byStatus} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
