"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SOURCE_LABELS, sourceStyle, barColor, levelStyle } from "../lib/format"
import type { StatsResult } from "../types"

function Leaderboard({
  title,
  subtitle,
  data,
  colorClass,
  renderLabel,
}: {
  title: string
  subtitle: string
  data: [string, number][]
  colorClass: string
  renderLabel: (key: string) => React.ReactNode
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
                <span className="truncate font-mono">{renderLabel(key)}</span>
                <span className="shrink-0 text-muted-foreground">{count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-all ${colorClass}`}
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

export function Breakdowns({
  stats,
  loading,
  onSelectAction,
  onSelectActor,
}: {
  stats?: StatsResult
  loading: boolean
  onSelectAction: (action: string) => void
  onSelectActor: (actor: string) => void
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-[260px]" />
        <Skeleton className="h-[260px]" />
        <Skeleton className="h-[260px]" />
      </div>
    )
  }

  const actions = Object.entries(stats?.byAction ?? {}).sort((a, b) => b[1] - a[1])
  const actors = Object.entries(stats?.byActor ?? {}).sort((a, b) => b[1] - a[1])
  const levels = Object.entries(stats?.byLevel ?? {}).sort((a, b) => b[1] - a[1])
  const sources = Object.entries(stats?.bySource ?? {}).sort((a, b) => b[1] - a[1])
  const maxLevel = levels.length > 0 ? levels[0][1] : 1

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Leaderboard
        title="Top Actions"
        subtitle="Most frequent operations"
        data={actions}
        colorClass="bg-primary"
        renderLabel={(key) => (
          <button
            type="button"
            onClick={() => onSelectAction(key)}
            className="cursor-pointer font-mono text-xs hover:text-primary"
            title={`Filter by ${key}`}
          >
            {key}
          </button>
        )}
      />

      <Leaderboard
        title="Top Actors"
        subtitle="Most active users & systems"
        data={actors}
        colorClass="bg-violet-500"
        renderLabel={(key) => (
          <button
            type="button"
            onClick={() => onSelectActor(key)}
            className="cursor-pointer truncate font-mono text-xs hover:text-primary"
            title={`Filter by ${key}`}
          >
            {key}
          </button>
        )}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Severity & Source</CardTitle>
          <CardDescription>Breakdown by level and origin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            {(["info", "warning", "error", "critical"] as const)
              .filter((lvl) => (stats?.byLevel[lvl] ?? 0) > 0)
              .map((lvl) => {
                const count = stats?.byLevel[lvl] ?? 0
                const { className, icon: LevelIcon } = levelStyle(lvl)
                return (
                  <div key={lvl} className="flex items-center gap-3">
                    <span className={`inline-flex w-24 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>
                      <LevelIcon className="h-3 w-3" />
                      {lvl}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full ${barColor(lvl)}`}
                        style={{ width: `${(count / maxLevel) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
                  </div>
                )
              })}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {sources.map(([source, count]) => (
              <span
                key={source}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${sourceStyle(source)}`}
              >
                {SOURCE_LABELS[source] ?? source}
                <span className="opacity-70">· {count}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
