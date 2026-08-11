"use client"

import { AlertCircle, BadgePercent, Clock, DollarSign, RotateCcw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { Skeleton } from "@/components/ui/skeleton"
import { currencySymbol, successRateColor } from "../lib/format"
import type { StatsResult } from "../types"

export function StatCards({ stats, loading }: { stats?: StatsResult; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
    )
  }

  const revenue = stats?.totalAmount ?? 0
  const currency = stats?.primaryCurrency ?? "USD"
  const symbol = currencySymbol(currency)
  const successRate = stats?.successRate ?? 0

  interface StatItem {
    label: string
    value: number
    symbol?: string
    suffix?: string
    decimals?: number
    sub?: string
    icon: React.ReactNode
    iconBg: string
    valueClass: string
  }

  const items: StatItem[] = [
    {
      label: "Revenue",
      value: revenue,
      symbol,
      sub: `${currency} · ${(stats?.completed ?? 0).toLocaleString()} txns`,
      icon: <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-500/10",
      valueClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Success Rate",
      value: successRate,
      symbol: "",
      suffix: "%",
      decimals: 1,
      sub: `${((stats?.completed ?? 0) + (stats?.failed ?? 0)).toLocaleString()} settled`,
      icon: <BadgePercent className="h-5 w-5 text-primary" />,
      iconBg: "bg-primary/10",
      valueClass: successRateColor(successRate),
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0,
      symbol: "",
      sub: "awaiting confirmation",
      icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-500/10",
      valueClass: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Failed",
      value: stats?.failed ?? 0,
      symbol: "",
      sub: `${stats?.refundRate ?? 0}% refund rate`,
      icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
      iconBg: "bg-red-500/10",
      valueClass: "text-red-600 dark:text-red-400",
    },
    {
      label: "Refunded",
      value: stats?.refunded ?? 0,
      symbol: "",
      sub: `avg ${stats?.avgOrderValue ? `${currencySymbol(currency)}${stats.avgOrderValue.toFixed(2)}` : "—"} / order`,
      icon: <RotateCcw className="h-5 w-5 text-muted-foreground" />,
      iconBg: "bg-muted",
      valueClass: "text-muted-foreground",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">{item.label}</p>
                <p className={`mt-1 font-heading text-xl font-bold ${item.valueClass}`}>
                  <CountUp
                    end={item.value}
                    prefix={item.symbol}
                    suffix={item.suffix ?? ""}
                    decimals={item.decimals ?? 0}
                  />
                </p>
                {item.sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{item.sub}</p>}
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
