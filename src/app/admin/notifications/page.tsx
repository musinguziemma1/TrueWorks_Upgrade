"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Bell, Check, CheckCheck, Trash2, Filter, Loader2 } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"


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

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const notifications = useQuery(api.notifications.list, {})
  const markRead = useMutation(api.notifications.markRead)
  const markAllRead = useMutation(api.notifications.markAllRead)
  const dismiss = useMutation(api.notifications.remove)

  const filtered = notifications?.filter((n) => {
    if (filter === "unread") return !n.read
    if (filter === "read") return n.read
    return true
  }) ?? []

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Notifications" }]}
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAllRead()}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /> <SelectValue /></SelectTrigger>
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
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n._id} className={!n.read ? "border-l-4 border-l-[#C9A227]" : ""}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className="mt-1 flex h-2 w-2 shrink-0">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-[#C9A227]" />}
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
                    <Button variant="ghost" size="icon-sm" onClick={() => markRead({ id: n._id })} title="Mark as read">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={() => dismiss({ id: n._id })} title="Dismiss">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
