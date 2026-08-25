"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { LifeBuoy, Search, Loader2, Mail, MailOpen, Trash2 } from "lucide-react"
import { api } from "@convex/_generated/api"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function SupportPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const messages = useQuery(api.contact.list, {})
  const markRead = useMutation(api.contact.markRead)
  const remove = useMutation(api.contact.remove)

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
    );
  }

  const filtered = messages.filter((m) => {
    if (statusFilter === "Unread" && m.read) return false;
    if (statusFilter === "Read" && !m.read) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${m.name} ${m.email} ${m.subject ?? ""} ${m.message}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const selected = selectedId ? messages.find((m) => m._id === selectedId) : null;

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Unread", "Read"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                description="When customers submit the contact form, their messages will appear here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((m) => (
                  <li
                    key={m._id}
                    onClick={() => {
                      setSelectedId(m._id);
                      if (!m.read) markRead({ id: m._id });
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
                        {m.subject ? <span className="font-medium">{m.subject} — </span> : null}
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
            <CardTitle>Message Detail</CardTitle>
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
                      <Button variant="outline" size="sm">Reply by email</Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Delete this message?")) {
                          remove({ id: selected._id });
                          setSelectedId(null);
                        }
                      }}
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
    </div>
  );
}
