"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  LifeBuoy,
  Search,
  Loader2,
  Mail,
  MailOpen,
  Trash2,
  ArrowLeft,
  Send,
  X,
  CheckCircle2,
  Reply,
  ArrowRight,
  BarChart3,
  MessageSquare,
  Inbox,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const STATUS_FILTERS = [
  { key: "All", label: "All" },
  { key: "Unread", label: "Unread" },
  { key: "Read", label: "Read" },
] as const

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
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("id") ?? null
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const messages = useQuery(api.contact.list, {})
  const me = useQuery(api.users.current, {})
  const markRead = useMutation(api.contact.markRead)
  const remove = useMutation(api.contact.remove)
  const saveReply = useMutation(api.contact.saveReply)
  const sendSupportReply = useAction(api.email.sendSupportReplyAction)

  const [replyOpen, setReplyOpen] = useState(false)
  const [replySubject, setReplySubject] = useState("")
  const [replyBody, setReplyBody] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (statusFilter !== "All") params.set("status", statusFilter)
    if (selectedId) params.set("id", selectedId)
    const qs = params.toString()
    router.replace(
      qs ? `/admin/support?${qs}` : "/admin/support",
      { scroll: false }
    )
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

  const selected = selectedId
    ? (messages?.find((m) => m._id === selectedId) ?? null)
    : null

  const unreadCount = messages?.filter((m) => !m.read).length ?? 0
  const repliedCount =
    messages?.filter((m) => m.lastReplyAt).length ?? 0

  const stats = {
    total: messages?.length ?? 0,
    unread: unreadCount,
    read: (messages?.length ?? 0) - unreadCount,
    replied: repliedCount,
  }

  const primeReply = () => {
    if (!selected) return
    const base = selected.subject?.trim() || "Your message to TrueWorks"
    setReplySubject(/^re:/i.test(base) ? base : `Re: ${base}`)
    setReplyBody("")
    setReplyOpen(true)
  }

  const cancelReply = () => {
    setReplyOpen(false)
  }

  const sendReply = async () => {
    if (!selected) return
    const body = replyBody.trim()
    if (!body) {
      toast.error("Write a reply before sending.")
      return
    }
    setSendingReply(true)
    try {
      const result = await sendSupportReply({
        contactMessageId: selected._id,
        customerEmail: selected.email,
        customerName: selected.name,
        originalMessage: selected.message,
        originalSubject: selected.subject,
        originalCreatedAt: selected.createdAt,
        replySubject: replySubject.trim() || undefined,
        replyBody: body,
        agentName: me?.name ?? me?.email ?? undefined,
      })
      if (!result.sent) {
        toast.error(result.error ?? "Failed to send reply")
        return
      }
      await saveReply({
        id: selected._id,
        replyBy: me?.name ?? me?.email ?? "Support agent",
        replyPreview: body,
      })
      toast.success(`Reply sent to ${selected.email}`)
      setReplyOpen(false)
      setReplyBody("")
    } catch (e) {
      toast.error(String(e))
    } finally {
      setSendingReply(false)
    }
  }

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

  const isLoading = messages === undefined

  const statCards = [
    {
      label: "Total Messages",
      value: stats.total,
      icon: MessageSquare,
      tint: "text-primary bg-primary/5",
      footnote: "All time",
    },
    {
      label: "Unread",
      value: stats.unread,
      icon: Inbox,
      tint: "text-blue-600 bg-blue-50/80",
      footnote: "Awaiting response",
    },
    {
      label: "Read",
      value: stats.read,
      icon: MailOpen,
      tint: "text-muted-foreground bg-muted/50",
      footnote: "Viewed messages",
    },
    {
      label: "Replied",
      value: stats.replied,
      icon: CheckCircle2,
      tint: "text-emerald-600 bg-emerald-50/80",
      footnote: "Responses sent",
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#0F3058] px-6 py-8 lg:px-8 lg:py-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
              <a href="/admin" className="transition-colors hover:text-white/80">
                Dashboard
              </a>
              <ArrowRight className="h-3 w-3" />
              <span className="text-white/70">Support</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Support
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Customer messages submitted via the contact form
            </p>
          </div>
        </section>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

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
              <span className="text-white/70">Support</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Support
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Customer messages submitted via the contact form
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
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
                {s.value}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {s.footnote}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 pl-10 pr-9"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              {f.key !== "All" && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {f.key === "Unread" ? stats.unread : stats.read}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* Messages List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
                <Mail className="h-4 w-4" />
              </span>
              <CardTitle>Messages</CardTitle>
            </div>
            <CardAction>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                {filtered.length} message{filtered.length === 1 ? "" : "s"}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<LifeBuoy className="h-12 w-12" />}
                title="No messages yet"
                description={
                  search
                    ? "No messages match your search."
                    : "When customers submit the contact form, their messages will appear here."
                }
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
                    className={cn(
                      "group flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-muted/40",
                      selectedId === m._id && "bg-surface",
                      !m.read && "bg-accent/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        m.read
                          ? "bg-muted/50 text-muted-foreground"
                          : "bg-primary text-white"
                      )}
                    >
                      {m.read ? (
                        <MailOpen className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm text-foreground",
                            !m.read ? "font-semibold" : "font-medium"
                          )}
                        >
                          {m.name}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {fmtDate(m.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {m.email}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                        {m.subject ? (
                          <span className="font-medium">
                            {m.subject} &mdash;{" "}
                          </span>
                        ) : null}
                        {m.message}
                      </p>
                      {m.lastReplyAt && (
                        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Replied
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <div className="flex items-center gap-2">
              {selected && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2 mr-1 h-8 w-8 lg:hidden"
                  onClick={() => setSelectedId(null)}
                  aria-label="Back to message list"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
                <MessageSquare className="h-4 w-4" />
              </span>
              <CardTitle>Message Detail</CardTitle>
            </div>
            {selected && !selected.read && (
              <CardAction>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  New
                </span>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Select a message to read it.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-surface p-4">
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selected.name}
                  </p>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {selected.email}
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/70 bg-surface p-3">
                    <p className="text-xs text-muted-foreground">Received</p>
                    <p className="mt-1 text-sm text-foreground">
                      {fmtDate(selected.createdAt)}
                    </p>
                  </div>
                  {selected.subject && (
                    <div className="rounded-xl border border-border/70 bg-surface p-3">
                      <p className="text-xs text-muted-foreground">Subject</p>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {selected.subject}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    Message
                  </p>
                  <p className="whitespace-pre-line rounded-xl border border-border/70 bg-surface p-4 text-sm text-foreground">
                    {selected.message}
                  </p>
                </div>

                {selected.lastReplyAt && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-3 text-xs">
                    <p className="flex items-center gap-1.5 font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Last reply sent
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      by {selected.lastReplyBy ?? "agent"} ·{" "}
                      {fmtDate(selected.lastReplyAt)}
                    </p>
                    {selected.lastReplyPreview && (
                      <p className="mt-1.5 line-clamp-3 italic text-foreground/80">
                        &ldquo;{selected.lastReplyPreview}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {replyOpen ? (
                  <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Reply className="h-3.5 w-3.5" />
                        Reply to {selected.email}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={cancelReply}
                        disabled={sendingReply}
                        aria-label="Cancel reply"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div>
                      <label
                        htmlFor="reply-subject"
                        className="text-[11px] font-medium text-muted-foreground"
                      >
                        Subject
                      </label>
                      <Input
                        id="reply-subject"
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        placeholder="Re: Your message"
                        className="mt-1"
                        disabled={sendingReply}
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reply-body"
                        className="text-[11px] font-medium text-muted-foreground"
                      >
                        Your reply
                      </label>
                      <Textarea
                        id="reply-body"
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Hi there, thanks for reaching out..."
                        className="mt-1 min-h-[140px]"
                        disabled={sendingReply}
                        maxLength={5000}
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        The customer will see a branded email with your reply and
                        their original message quoted below.
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelReply}
                        disabled={sendingReply}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={sendReply}
                        disabled={sendingReply || !replyBody.trim()}
                      >
                        {sendingReply ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {sendingReply ? "Sending..." : "Send reply"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {selected.read ? "Read" : "Unread"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={primeReply}
                        aria-label={`Reply to ${selected.email}`}
                      >
                        <Reply className="mr-1.5 h-3.5 w-3.5" />
                        Reply
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(selected._id)}
                        aria-label={`Delete message from ${selected.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null)
        }}
        title="Delete this message?"
        description="This permanently removes the customer message. This action cannot be undone."
        confirmLabel="Delete message"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
