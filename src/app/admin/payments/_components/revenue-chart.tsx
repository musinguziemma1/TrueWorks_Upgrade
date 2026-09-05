"use client"

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CHART_COLORS, currencySymbol, formatCompact, formatMoney } from "../lib/format"
import type { StatsResult } from "../types"

const REVENUE_COLOR = CHART_COLORS[0]
const VOLUME_COLOR = CHART_COLORS[1]

export function RevenueChart({ stats, loading }: { stats?: StatsResult; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[260px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const currency = stats?.primaryCurrency ?? "USD"
  const symbol = currencySymbol(currency)

  const data = (stats?.trend ?? []).map((p) => ({
    label: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: p.revenue,
    count: p.count,
  }))

  const totalRevenue = data.reduce((sum, p) => sum + p.revenue, 0)
  const totalCount = data.reduce((sum, p) => sum + p.count, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
          </span>
          <CardTitle>Revenue Trend</CardTitle>
        </div>
        <CardDescription>
          {data.length > 0
            ? `${formatMoney(totalRevenue, currency)} across ${totalCount.toLocaleString()} completed payment${totalCount === 1 ? "" : "s"} in ${currency}`
            : "No completed payments in this period"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-10 w-10" />}
            title="No revenue recorded"
            description="No completed payments in this date range. Try widening the date filter or check back once more orders come in."
          />
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="payRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={REVENUE_COLOR} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={REVENUE_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  yAxisId="revenue"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${symbol}${formatCompact(v)}`}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                    boxShadow: "0 4px 12px -2px rgba(0,0,0,0.12)",
                  }}
                  labelFormatter={(label) => `Day: ${label}`}
                  formatter={(value, name) => {
                    if (name === "revenue") return [formatMoney(Number(value), currency), "Revenue"]
                    return [`${Number(value).toLocaleString()} payments`, "Volume"]
                  }}
                />
                <Bar
                  yAxisId="count"
                  dataKey="count"
                  fill={VOLUME_COLOR}
                  fillOpacity={0.5}
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={REVENUE_COLOR}
                  strokeWidth={2}
                  fill="url(#payRevenue)"
                  dot={false}
                  activeDot={{ r: 4, fill: REVENUE_COLOR }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
