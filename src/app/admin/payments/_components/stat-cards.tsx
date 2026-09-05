"use client"

import { AlertCircle, BadgePercent, Clock, DollarSign, RotateCcw } from "lucide-react"
import { StatCard } from "@/components/admin/stat-card"
import { StatCardSkeleton } from "@/components/admin/table-skeleton"
import { currencySymbol, statTone } from "../lib/format"
import type { StatsResult } from "../types"

export function StatCards({ stats, loading }: { stats?: StatsResult; loading: boolean }) {
  const revenue = stats?.totalAmount ?? 0
  const currency = stats?.primaryCurrency ?? "USD"
  const symbol = currencySymbol(currency)
  const successRate = stats?.successRate ?? 0
  const completed = stats?.completed ?? 0
  const failed = stats?.failed ?? 0
  const pending = stats?.pending ?? 0
  const refunded = stats?.refunded ?? 0
  const refundRate = stats?.refundRate ?? 0
  const avgOrderValue = stats?.avgOrderValue ?? 0

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatCard
        label="Revenue"
        value={`${symbol}${revenue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
        icon={DollarSign}
        tint={statTone("revenue")}
        footnote={`${currency} · ${completed.toLocaleString()} completed`}
      />
      <StatCard
        label="Success Rate"
        value={`${successRate.toFixed(1)}%`}
        icon={BadgePercent}
        tint={statTone("success")}
        footnote={`${(completed + failed).toLocaleString()} settled`}
      />
      <StatCard
        label="Pending"
        value={pending.toLocaleString()}
        icon={Clock}
        tint={statTone("pending")}
        footnote="Awaiting confirmation"
      />
      <StatCard
        label="Failed"
        value={failed.toLocaleString()}
        icon={AlertCircle}
        tint={statTone("failed")}
        footnote={`${refundRate.toFixed(1)}% refund rate`}
      />
      <StatCard
        label="Refunded"
        value={refunded.toLocaleString()}
        icon={RotateCcw}
        tint={statTone("refund")}
        footnote={
          avgOrderValue > 0
            ? `avg ${symbol}${avgOrderValue.toFixed(2)} / order`
            : "—"
        }
      />
    </div>
  )
}
