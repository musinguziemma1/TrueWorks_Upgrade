"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { CampaignsStats } from "../types"

export function EngagementChart({ stats, loading }: { stats?: CampaignsStats; loading: boolean }) {
  if (loading) return <Skeleton className="h-[280px]" />

  const data = (stats?.performance ?? []).map((c) => ({
    name: c.name.length > 18 ? `${c.name.slice(0, 18)}…` : c.name,
    openRate: c.openRate,
    clickRate: c.clickRate,
    sent: c.sentCount,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Engagement by Campaign</CardTitle>
        <CardDescription>
          Open and click rate (%) for your most recent {data.length} campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Send a campaign to see engagement rates.
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === "openRate" ? "Open rate" : "Click rate"]}
                />
                <Legend
                  formatter={(value) => (value === "openRate" ? "Open rate" : "Click rate")}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="openRate" fill="#3E6990" radius={[3, 3, 0, 0]} />
                <Bar dataKey="clickRate" fill="#C9A227" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
