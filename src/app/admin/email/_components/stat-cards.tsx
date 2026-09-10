"use client"

import { CalendarClock, MailCheck, MousePointerClick, Send, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { Skeleton } from "@/components/ui/skeleton"
import { rateColor } from "../lib/format"
import type { CampaignsStats } from "../types"
import { cn } from "@/lib/utils"

export function StatCards({ stats, loading }: { stats?: CampaignsStats; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
    )
  }

  interface StatItem {
    label: string
    value: number
    suffix?: string
    decimals?: number
    sub?: string
    icon: React.ReactNode
    iconBg: string
    valueClass: string
  }

  const openRate = stats?.avgOpenRate ?? 0
  const clickRate = stats?.avgClickRate ?? 0

  const items: StatItem[] = [
    {
      label: "Subscribers",
      value: stats?.subscribers ?? 0,
      sub: "all-time signups",
      icon: <Users className="h-4 w-4" />,
      iconBg: "text-primary bg-primary/5",
      valueClass: "text-foreground",
    },
    {
      label: "Active",
      value: stats?.activeSubscribers ?? 0,
      sub: `${stats?.subscribers && stats.subscribers > 0 ? Math.round((stats.activeSubscribers / stats.subscribers) * 100) : 0}% of list`,
      icon: <MailCheck className="h-4 w-4" />,
      iconBg: "text-emerald-600 bg-emerald-50/80",
      valueClass: "text-foreground",
    },
    {
      label: "Campaigns Sent",
      value: stats?.sent ?? 0,
      sub: `${(stats?.totalSent ?? 0).toLocaleString()} total recipients`,
      icon: <Send className="h-4 w-4" />,
      iconBg: "text-blue-600 bg-blue-50/80",
      valueClass: "text-foreground",
    },
    {
      label: "Open Rate",
      value: openRate,
      suffix: "%",
      decimals: 1,
      sub: `${(stats?.totalOpened ?? 0).toLocaleString()} opens`,
      icon: <MailCheck className="h-4 w-4" />,
      iconBg: "text-amber-600 bg-amber-50/80",
      valueClass: rateColor(openRate),
    },
    {
      label: "Click Rate",
      value: clickRate,
      suffix: "%",
      decimals: 1,
      sub: `${(stats?.totalClicked ?? 0).toLocaleString()} clicks`,
      icon: <MousePointerClick className="h-4 w-4" />,
      iconBg: "text-violet-600 bg-violet-50/80",
      valueClass: rateColor(clickRate),
    },
    {
      label: "Scheduled",
      value: stats?.scheduled ?? 0,
      sub: `${(stats?.draft ?? 0).toLocaleString()} drafts · ${(stats?.sending ?? 0).toLocaleString()} sending`,
      icon: <CalendarClock className="h-4 w-4" />,
      iconBg: "text-muted-foreground bg-muted/50",
      valueClass: "text-foreground",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className={cn("mt-1.5 font-heading text-xl font-bold tabular-nums", item.valueClass)}>
                  <CountUp
                    end={item.value}
                    suffix={item.suffix ?? ""}
                    decimals={item.decimals ?? 0}
                  />
                </p>
                {item.sub && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{item.sub}</p>
                )}
              </div>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  item.iconBg
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
