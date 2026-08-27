"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Bell, Check, CheckCheck, Trash2, Filter, Loader2, Search, X } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { useDebouncedValue } from "@/lib/use-debounced-value"

type Filter = "all" | "unread" | "read"

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

  const notifications = useQuery(api.notifications.list, {})
  const markRead = useMutation(api.notifications.markRead)
  const markAllRead = useMutation(api.notifications.markAllRead)
  const dismiss = useMutation(api.notifications.remove)

  // Keep URL in sync with the active filter so views are shareable.
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
      if (filter === "unread") {
        if (n.read) return false
      } else if (filter === "read") {
        if (!n.read) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const hay = `${n.title} ${n.message} ${n.type}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [notifications, filter, search])

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  // Group by date for a premium timeline feel.
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Notifications" }]}
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAllRead()} aria-label={`Mark all ${unreadCount} notifications as read`}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            aria-label="Search notifications"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={filter} onValueChange={(v) => v && setFilter(v as Filter)}>
          <SelectTrigger className="w-[160px]" aria-label="Filter notifications by status">
            <Filter className="h-4 w-4 mr-1" /> <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {notifications === undefined ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#0B2545]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title={search ? "No matching notifications" : "No notifications"}
          description={search ? "Try a different search term." : "You're all caught up!"}
        />
      ) : (
        <div className="space-y-5">
          {grouped.map((section) => (
            <div key={section.label}>
              <div className="sticky top-0 z-10 mb-2 px-1 py-1.5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</p>
              </div>
              <div className="space-y-2">
                {section.items.map((n) => (
                  <Card key={n._id} className={!n.read ? "border-l-4 border-l-[#C9A227]" : ""}>
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="mt-1 flex h-2 w-2 shrink-0">
                        {!n.read && <span className="h-2 w-2 rounded-full bg-[#C9A227]" aria-hidden="true" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          {!n.read && <Badge variant="outline" className="text-[10px] px-1 py-0">New</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.read && (
                          <Button variant="ghost" size="icon-sm" onClick={() => markRead({ id: n._id })} aria-label={`Mark "${n.title}" as read`}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => dismiss({ id: n._id })} aria-label={`Dismiss "${n.title}"`}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
