"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { StatsResult } from "../types"

interface TrendPoint {
  timestamp: number
  count: number
}

export function TrendChart({ stats, loading }: { stats?: StatsResult; loading: boolean }) {
  if (loading) return <Skeleton className="h-[240px]" />

  const data: TrendPoint[] = stats?.trend ?? []
  const chartData = data.map((p) => ({
    label: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: p.count,
  }))

  const total = data.reduce((sum, p) => sum + p.count, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Activity Trend</CardTitle>
        <CardDescription>
          {data.length > 0 ? `${total.toLocaleString()} events across ${data.length} day${data.length === 1 ? "" : "s"}` : "No events in this period"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            No activity recorded in this period.
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="auditTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A227" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C9A227" stopOpacity={0.02} />
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
                  formatter={(value) => [`${Number(value).toLocaleString()} events`, "Activity"]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#C9A227"
                  strokeWidth={2}
                  fill="url(#auditTrend)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
