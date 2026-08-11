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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { currencySymbol, formatCompact, formatMoney } from "../lib/format"
import type { StatsResult } from "../types"

export function RevenueChart({ stats, loading }: { stats?: StatsResult; loading: boolean }) {
  if (loading) return <Skeleton className="h-[280px]" />

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
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Revenue Trend</CardTitle>
        <CardDescription>
          {data.length > 0
            ? `${formatMoney(totalRevenue, currency)} across ${totalCount.toLocaleString()} completed payment${totalCount === 1 ? "" : "s"} in ${currency}`
            : "No completed payments in this period"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            No revenue recorded in this period.
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="payRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B2545" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0B2545" stopOpacity={0.02} />
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
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
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
                  fill="#C9A227"
                  fillOpacity={0.5}
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0B2545"
                  strokeWidth={2}
                  fill="url(#payRevenue)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
