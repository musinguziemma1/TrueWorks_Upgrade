"use client"

import { Cell, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { methodLabel, providerLabel, statusMeta } from "../lib/format"
import type { StatsResult } from "../types"

const COLORS = ["#0B2545", "#3E6990", "#C9A227", "#60A5FA", "#34D399", "#94A8B8", "#F59E0B", "#EF4444"]

const STATUS_ORDER = ["completed", "pending", "failed", "refunded"] as const
const STATUS_BAR_COLORS: Record<string, string> = {
  completed: "bg-emerald-500",
  pending: "bg-amber-500",
  failed: "bg-red-500",
  refunded: "bg-slate-400",
}

function MiniLeaderboard({
  title,
  subtitle,
  data,
  renderLabel,
}: {
  title: string
  subtitle: string
  data: [string, number][]
  renderLabel: (key: string) => string
}) {
  const max = data.length > 0 ? data[0][1] : 1
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No data in this period.</p>
        ) : (
          data.slice(0, 6).map(([key, count]) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="truncate">{renderLabel(key)}</span>
                <span className="shrink-0 text-muted-foreground">{count.toLocaleString()}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function Breakdowns({ stats, loading }: { stats?: StatsResult; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Skeleton className="h-[280px]" />
        <Skeleton className="h-[240px]" />
        <Skeleton className="h-[240px]" />
      </div>
    )
  }

  const providers = Object.entries(stats?.byProvider ?? {}).sort((a, b) => b[1] - a[1])
  const methods = Object.entries(stats?.byMethod ?? {}).sort((a, b) => b[1] - a[1])
  const byStatus = stats?.byStatus ?? {}
  const maxStatus = Math.max(1, ...STATUS_ORDER.map((s) => byStatus[s] ?? 0))

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Provider Mix</CardTitle>
          <CardDescription>Transactions split by payment provider.</CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              No data in this period.
            </div>
          ) : (
            <>
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
                      {providers.map(([name], i) => (
                        <Cell key={name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value, name) => [`${Number(value).toLocaleString()} txns`, name]}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                {providers.map(([name, count], i) => (
                  <span key={name} className="inline-flex items-center gap-1.5 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {providerLabel(name)}
                    <span className="text-muted-foreground">{count.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <MiniLeaderboard
        title="Payment Methods"
        subtitle="Most used payment methods"
        data={methods}
        renderLabel={methodLabel}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Status Distribution</CardTitle>
          <CardDescription>Current payment health snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {STATUS_ORDER.filter((s) => (byStatus[s] ?? 0) > 0).map((s) => {
            const count = byStatus[s] ?? 0
            const meta = statusMeta(s)
            return (
              <div key={s} className="flex items-center gap-3">
                <span className={`w-20 shrink-0 text-xs font-medium ${meta.className} inline-flex items-center justify-center gap-1 rounded-full px-2 py-0.5`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR_COLORS[s]}`}
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                  {count.toLocaleString()}
                </span>
              </div>
            )
          })}
          {Object.keys(byStatus).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No data in this period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
