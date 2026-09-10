"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  Search,
  X,
  ShoppingCart,
  Star,
  Shield,
  AlertTriangle,
  Info,
  Zap,
  ArrowRight,
  BarChart3,
  Inbox,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { cn } from "@/lib/utils"

type Filter = "all" | "unread" | "read"

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; tint: string }
> = {
  order: { icon: ShoppingCart, tint: "text-emerald-600 bg-emerald-50/80" },
  review: { icon: Star, tint: "text-amber-600 bg-amber-50/80" },
  security: { icon: Shield, tint: "text-red-600 bg-red-50/80" },
  warning: { icon: AlertTriangle, tint: "text-orange-600 bg-orange-50/80" },
  promo: { icon: Zap, tint: "text-violet-600 bg-violet-50/80" },
}
const DEFAULT_TYPE = { icon: Info, tint: "text-blue-600 bg-blue-50/80" }

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
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  const startOfYesterday = startOfToday - 86_400_000
  if (ts >= startOfToday) return "Today"
  if (ts >= startOfYesterday) return "Yesterday"
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const FILTERS = [
  { key: "all" as const, label: "All" },
  { key: "unread" as const, label: "Unread" },
  { key: "read" as const, label: "Read" },
]

export default function NotificationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get("filter")
  const isValidFilter = (v: string | null): v is Filter =>
    v === "all" || v === "unread" || v === "read"
  const [filter, setFilter] = useState<Filter>(() =>
    isValidFilter(initialFilter) ? initialFilter : "all"
  )
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
    router.replace(
      qs ? `/admin/notifications?${qs}` : "/admin/notifications",
      { scroll: false }
    )
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

  const unreadCount =
    notifications?.filter((n) => !n.read).length ?? 0

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

  const filterCounts = useMemo(
    () => ({
      all: notifications?.length ?? 0,
      unread: notifications?.filter((n) => !n.read).length ?? 0,
      read: notifications?.filter((n) => n.read).length ?? 0,
    }),
    [notifications]
  )

  const isLoading = notifications === undefined

  const statCards = [
    {
      label: "Total",
      value: filterCounts.all,
      icon: Bell,
      tint: "text-primary bg-primary/5",
      footnote: "All notifications",
    },
    {
      label: "Unread",
      value: filterCounts.unread,
      icon: Inbox,
      tint: "text-blue-600 bg-blue-50/80",
      footnote: "Needs attention",
    },
    {
      label: "Read",
      value: filterCounts.read,
      icon: Eye,
      tint: "text-muted-foreground bg-muted/50",
      footnote: "Already viewed",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#0F3058] px-6 py-8 lg:px-8 lg:py-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
              <a
                href="/admin"
                className="transition-colors hover:text-white/80"
              >
                Dashboard
              </a>
              <ArrowRight className="h-3 w-3" />
              <span className="text-white/70">Notifications</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-white/60">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              className="bg-accent text-primary-dark hover:bg-accent/90"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/70 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  s.tint
                )}
              >
                <s.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
              {isLoading ? (
                <span className="inline-block h-6 w-12 animate-pulse rounded bg-muted" />
              ) : (
                s.value
              )}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {s.footnote}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 pl-10 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              <span className="ml-1.5 text-[10px] opacity-70">
                {filterCounts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Notification List */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-white py-16 text-center shadow-card">
              <div className="mb-4 rounded-full bg-muted/50 p-4">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-medium text-foreground">
                {search ? "No matching notifications" : "No notifications"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Try a different search term."
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-340px)]">
              <div className="space-y-6 pr-4">
                {grouped.map((section) => (
                  <div key={section.label}>
                    <div className="sticky top-0 z-10 mb-3 bg-background/95 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                      <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                                : "border-border/70 bg-white hover:bg-muted/30",
                              selectedId === n._id &&
                                "ring-2 ring-primary/20 bg-primary/[0.03]"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                typeConfig.tint
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                      {n.title}
                                    </p>
                                    {!n.read && (
                                      <span
                                        className="h-2 w-2 shrink-0 rounded-full bg-primary"
                                        aria-hidden="true"
                                      />
                                    )}
                                  </div>
                                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                                    {n.message}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                      typeConfig.tint
                                    )}
                                  >
                                    {n.type}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {timeAgo(n.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
                              {!n.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markRead({ id: n._id })
                                  }}
                                  aria-label={`Mark "${n.title}" as read`}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dismiss({ id: n._id })
                                }}
                                aria-label={`Dismiss "${n.title}"`}
                              >
                                <Trash2 className="h-4 w-4" />
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

        {/* Detail Panel */}
        {selected && (
          <div className="hidden w-80 shrink-0 lg:block">
            <div className="sticky top-6 rounded-2xl border border-border/70 bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center gap-3">
                {(() => {
                  const tc = TYPE_CONFIG[selected.type] ?? DEFAULT_TYPE
                  const Icon = tc.icon
                  return (
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        tc.tint
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  )
                })()}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {selected.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(selected.createdAt)}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {selected.message}
              </p>
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => markRead({ id: selected._id })}
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    Mark read
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    dismiss({ id: selected._id })
                    setSelectedId(null)
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
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
