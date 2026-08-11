"use client"

import { CalendarClock, MailCheck, MousePointerClick, Send, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { Skeleton } from "@/components/ui/skeleton"
import { rateColor } from "../lib/format"
import type { CampaignsStats } from "../types"

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
      icon: <Users className="h-5 w-5 text-primary" />,
      iconBg: "bg-primary/10",
      valueClass: "text-primary",
    },
    {
      label: "Active",
      value: stats?.activeSubscribers ?? 0,
      sub: `${stats?.subscribers && stats.subscribers > 0 ? Math.round((stats.activeSubscribers / stats.subscribers) * 100) : 0}% of list`,
      icon: <MailCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-500/10",
      valueClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Campaigns Sent",
      value: stats?.sent ?? 0,
      sub: `${(stats?.totalSent ?? 0).toLocaleString()} total recipients`,
      icon: <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      iconBg: "bg-blue-500/10",
      valueClass: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Open Rate",
      value: openRate,
      suffix: "%",
      decimals: 1,
      sub: `${(stats?.totalOpened ?? 0).toLocaleString()} opens`,
      icon: <MailCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-500/10",
      valueClass: rateColor(openRate),
    },
    {
      label: "Click Rate",
      value: clickRate,
      suffix: "%",
      decimals: 1,
      sub: `${(stats?.totalClicked ?? 0).toLocaleString()} clicks`,
      icon: <MousePointerClick className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
      iconBg: "bg-violet-500/10",
      valueClass: rateColor(clickRate),
    },
    {
      label: "Scheduled",
      value: stats?.scheduled ?? 0,
      sub: `${(stats?.draft ?? 0).toLocaleString()} drafts · ${(stats?.sending ?? 0).toLocaleString()} sending`,
      icon: <CalendarClock className="h-5 w-5 text-muted-foreground" />,
      iconBg: "bg-muted",
      valueClass: "text-muted-foreground",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">{item.label}</p>
                <p className={`mt-1 font-heading text-xl font-bold ${item.valueClass}`}>
                  <CountUp
                    end={item.value}
                    suffix={item.suffix ?? ""}
                    decimals={item.decimals ?? 0}
                  />
                </p>
                {item.sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{item.sub}</p>}
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
                {item.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
