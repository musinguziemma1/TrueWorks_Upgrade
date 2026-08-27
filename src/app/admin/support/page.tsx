"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { LifeBuoy, Search, Loader2, Mail, MailOpen, Trash2, ArrowLeft } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function SupportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get("status")
  const isValidStatus = (v: string | null): v is "All" | "Unread" | "Read" =>
    v === "All" || v === "Unread" || v === "Read"
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "")
  const search = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<"All" | "Unread" | "Read">(
    () => (isValidStatus(initialStatus) ? initialStatus : "All")
  )
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("id") ?? null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const messages = useQuery(api.contact.list, {})
  const markRead = useMutation(api.contact.markRead)
  const remove = useMutation(api.contact.remove)

  // Keep URL in sync with the active filters + selection.
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (statusFilter !== "All") params.set("status", statusFilter)
    if (selectedId) params.set("id", selectedId)
    const qs = params.toString()
    router.replace(qs ? `/admin/support?${qs}` : "/admin/support", { scroll: false })
  }, [search, statusFilter, selectedId, router])

  const filtered = useMemo(() => {
    return (messages ?? []).filter((m) => {
      if (statusFilter === "Unread" && m.read) return false
      if (statusFilter === "Read" && !m.read) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = `${m.name} ${m.email} ${m.subject ?? ""} ${m.message}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [messages, statusFilter, search])

  const selected = selectedId ? (messages?.find((m) => m._id === selectedId) ?? null) : null

  const unreadCount = messages?.filter((m) => !m.read).length ?? 0

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      await remove({ id: deleteId as never })
      toast.success("Message deleted")
      if (selectedId === deleteId) setSelectedId(null)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (messages === undefined) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Support"
          description="Customer messages submitted via the contact form"
          breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Support" }]}
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Support"
        description="Customer messages submitted via the contact form"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Support" }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            aria-label="Search support messages"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as "All" | "Unread" | "Read")}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by read status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["All", "Unread", "Read"].map((s) => (
              <SelectItem key={s} value={s}>
                {s} {s !== "All" && `(${s === "Unread" ? unreadCount : (messages?.length ?? 0) - unreadCount})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardAction>
              <span className="text-sm text-muted-foreground">{filtered.length} message{filtered.length === 1 ? "" : "s"}</span>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<LifeBuoy className="h-12 w-12" />}
                title="No messages yet"
                description={search ? "No messages match your search." : "When customers submit the contact form, their messages will appear here."}
              />
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((m) => (
                  <li
                    key={m._id}
                    onClick={() => {
                      setSelectedId(m._id)
                      if (!m.read) markRead({ id: m._id })
                    }}
                    className={`group flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-surface ${
                      selectedId === m._id ? "bg-surface" : ""
                    } ${!m.read ? "bg-accent/[0.04]" : ""}`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      m.read ? "bg-muted text-muted-foreground" : "bg-primary text-white"
                    }`}>
                      {m.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm ${!m.read ? "font-semibold" : "font-medium"} text-foreground`}>
                          {m.name}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(m.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{m.email}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                        {m.subject ? <span className="font-medium">{m.subject} &mdash; </span> : null}
                        {m.message}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-6 self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selected && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden -ml-2 mr-1"
                  onClick={() => setSelectedId(null)}
                  aria-label="Back to message list"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              Message Detail
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Select a message to read it.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">From</p>
                  <p className="mt-1 font-semibold text-foreground">{selected.name}</p>
                  <a href={`mailto:${selected.email}`} className="text-sm text-primary hover:underline">
                    {selected.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Received</p>
                  <p className="mt-1 text-sm text-foreground">{fmtDate(selected.createdAt)}</p>
                </div>
                {selected.subject && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">Subject</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{selected.subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Message</p>
                  <p className="mt-1 whitespace-pre-line rounded-lg border border-border bg-surface p-4 text-sm text-foreground">
                    {selected.message}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <StatusBadge status={selected.read ? "read" : "unread"} />
                  <div className="flex gap-2">
                    <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject ?? "Your message")}`}>
                      <Button variant="outline" size="sm" aria-label={`Reply to ${selected.email} by email`}>Reply by email</Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(selected._id)}
                      aria-label={`Delete message from ${selected.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open && !deleting) setDeleteId(null) }}
        title="Delete this message?"
        description="This permanently removes the customer message. This action cannot be undone."
        confirmLabel="Delete message"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
