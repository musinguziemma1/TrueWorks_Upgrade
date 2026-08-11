"use client"

import { Activity, AlertCircle, TrendingUp, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLatency } from "../lib/format"
import type { StatsResult } from "../types"

export function StatCards({ stats, loading }: { stats?: StatsResult; loading: boolean }) {
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
      icon: <Activity className="h-5 w-5 text-primary" />,
      iconBg: "bg-primary/10",
      valueClass: "text-primary",
      numeric: true,
    },
    {
      label: "Errors",
      value: stats?.errorCount ?? 0,
      icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
      iconBg: "bg-red-500/10",
      valueClass: "text-red-600 dark:text-red-400",
      numeric: true,
    },
    {
      label: "Avg Latency",
      value: stats?.avgLatencyMs ?? 0,
      icon: <Zap className="h-5 w-5 text-accent-dark" />,
      iconBg: "bg-accent/10",
      valueClass: "text-primary",
      numeric: false,
    },
    {
      label: "Slow Operations",
      value: stats?.slowOpsCount ?? 0,
      icon: <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-500/10",
      valueClass: stats && stats.slowOpsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-primary",
      numeric: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">{item.label}</p>
                <p className={`mt-1 font-heading text-2xl font-bold ${item.valueClass}`}>
                  {item.numeric ? (
                    <CountUp end={item.value} />
                  ) : item.value > 0 ? (
                    formatLatency(item.value)
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}>
                {item.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
