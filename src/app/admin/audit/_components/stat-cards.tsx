"use client"

import { Activity, AlertCircle, TrendingUp, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLatency } from "../lib/format"
import type { StatsResult } from "../types"
import { cn } from "@/lib/utils"

export function StatCards({
  stats,
  loading,
}: {
  stats?: StatsResult
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
    )
  }

  const items = [
    {
      label: "Total Events",
      value: stats?.total ?? 0,
      icon: <Activity className="h-4 w-4" />,
      tint: "text-primary bg-primary/5",
      numeric: true,
    },
    {
      label: "Errors",
      value: stats?.errorCount ?? 0,
      icon: <AlertCircle className="h-4 w-4" />,
      tint: "text-red-600 bg-red-50/80",
      numeric: true,
    },
    {
      label: "Avg Latency",
      value: stats?.avgLatencyMs ?? 0,
      icon: <Zap className="h-4 w-4" />,
      tint: "text-accent-dark bg-accent/10",
      numeric: false,
    },
    {
      label: "Slow Operations",
      value: stats?.slowOpsCount ?? 0,
      icon: <TrendingUp className="h-4 w-4" />,
      tint:
        stats && stats.slowOpsCount > 0
          ? "text-amber-600 bg-amber-50/80"
          : "text-muted-foreground bg-muted/50",
      numeric: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
                  {item.numeric ? (
                    <CountUp end={item.value} />
                  ) : item.value > 0 ? (
                    formatLatency(item.value)
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  item.tint
                )}
              >
                {item.icon}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
