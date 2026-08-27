"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Bell, Check, CheckCheck, Trash2, Filter, Loader2, Search, X,
  ShoppingCart, Star, Shield, AlertTriangle, Info, Zap
} from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { cn } from "@/lib/utils"

type Filter = "all" | "unread" | "read"

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  order: { icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
  review: { icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
  security: { icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  warning: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  promo: { icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
}
const DEFAULT_TYPE = { icon: Info, color: "text-blue-600", bg: "bg-blue-50" }

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

function dateGroupLabel(ts: number): string {
  const now = new Date()
  const d = new Date(ts)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 86_400_000
  if (ts >= startOfToday) return "Today"
  if (ts >= startOfYesterday) return "Yesterday"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

export default function NotificationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get("filter")
  const isValidFilter = (v: string | null): v is Filter =>
    v === "all" || v === "unread" || v === "read"
  const [filter, setFilter] = useState<Filter>(() => (isValidFilter(initialFilter) ? initialFilter : "all"))
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const notifications = useQuery(api.notifications.list, {})
  const markRead = useMutation(api.notifications.markRead)
  const markAllRead = useMutation(api.notifications.markAllRead)
  const dismiss = useMutation(api.notifications.remove)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (filter === "all") {
      params.delete("filter")
    } else {
      params.set("filter", filter)
    }
    const qs = params.toString()
    router.replace(qs ? `/admin/notifications?${qs}` : "/admin/notifications", { scroll: false })
  }, [filter, router, searchParams])

  const filtered = useMemo(() => {
    const list = notifications ?? []
    return list.filter((n) => {
      if (filter === "unread" && n.read) return false
      if (filter === "read" && !n.read) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = `${n.title} ${n.message} ${n.type}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [notifications, filter, search])

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  const grouped = useMemo(() => {
    const sections: { label: string; items: typeof filtered }[] = []
    for (const n of filtered) {
      const label = dateGroupLabel(n.createdAt)
      const last = sections[sections.length - 1]
      if (last && last.label === label) {
        last.items.push(n)
      } else {
        sections.push({ label, items: [n] })
      }
    }
    return sections
  }, [filtered])

  const selected = filtered.find((n) => n._id === selectedId)

  const filterCounts = useMemo(() => ({
    all: notifications?.length ?? 0,
    unread: notifications?.filter((n) => !n.read).length ?? 0,
    read: notifications?.filter((n) => n.read).length ?? 0,
  }), [notifications])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Notifications" }]}
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAllRead()} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
              {(["all", "unread", "read"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    filter === f
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all" ? "All" : f === "unread" ? "Unread" : "Read"}
                  <span className="ml-1.5 text-xs opacity-60">({filterCounts[f]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notification list */}
          {notifications === undefined ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground">
                {search ? "No matching notifications" : "No notifications"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? "Try a different search term." : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-6 pr-4">
                {grouped.map((section) => (
                  <div key={section.label}>
                    <div className="sticky top-0 z-10 mb-3 px-1 py-1.5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.label}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((n) => {
                        const typeConfig = TYPE_CONFIG[n.type] ?? DEFAULT_TYPE
                        const Icon = typeConfig.icon
                        return (
                          <div
                            key={n._id}
                            onClick={() => setSelectedId(n._id)}
                            className={cn(
                              "group relative flex items-start gap-4 rounded-xl border p-4 transition-all cursor-pointer",
                              !n.read
                                ? "border-l-4 border-l-primary bg-primary/[0.02] hover:bg-primary/[0.04]"
                                : "border-border bg-background hover:bg-muted/30",
                              selectedId === n._id && "ring-2 ring-primary/20 bg-primary/[0.03]"
                            )}
                          >
                            <div className={cn("rounded-lg p-2.5 shrink-0", typeConfig.bg)}>
                              <Icon className={cn("h-5 w-5", typeConfig.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                                    {!n.read && (
                                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="secondary" className="text-[10px] font-normal">
                                    {n.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1">
                              {!n.read && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={(e) => { e.stopPropagation(); markRead({ id: n._id }) }}
                                  aria-label={`Mark "${n.title}" as read`}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => { e.stopPropagation(); dismiss({ id: n._id }) }}
                                aria-label={`Dismiss "${n.title}"`}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-6 rounded-xl border bg-muted/20 p-5">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const tc = TYPE_CONFIG[selected.type] ?? DEFAULT_TYPE
                  const Icon = tc.icon
                  return (
                    <div className={cn("rounded-lg p-2", tc.bg)}>
                      <Icon className={cn("h-5 w-5", tc.color)} />
                    </div>
                  )
                })()}
                <div>
                  <p className="text-sm font-semibold">{selected.title}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(selected.createdAt)}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.message}</p>
              {selected.link && (
                <a
                  href={selected.link}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View details
                </a>
              )}
              <div className="mt-5 flex gap-2">
                {!selected.read && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => markRead({ id: selected._id })}>
                    <Check className="h-4 w-4 mr-1.5" />
                    Mark read
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { dismiss({ id: selected._id }); setSelectedId(null) }}>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
