"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Loader2,
  Shield,
  Activity,
  Users,
  XCircle,
  KeyRound,
  Globe,
  Search,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Ban,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function fmtDate(ts?: number) {
  if (!ts) return "—"
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function timeAgo(ts?: number) {
  if (!ts) return "—"
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return "Just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function parseDevice(ua?: string) {
  if (!ua) return { device: "Unknown", browser: "Unknown", os: "Unknown" }
  let device = "Desktop"
  if (/tablet|ipad/i.test(ua)) device = "Tablet"
  else if (/mobile|android|iphone|ipod/i.test(ua)) device = "Mobile"
  let browser = "Unknown"
  if (/edg\//i.test(ua)) browser = "Edge"
  else if (/opr\//i.test(ua)) browser = "Opera"
  else if (/chrome\//i.test(ua)) browser = "Chrome"
  else if (/safari\//i.test(ua)) browser = "Safari"
  else if (/firefox\//i.test(ua)) browser = "Firefox"
  let os = "Unknown"
  if (/windows/i.test(ua)) os = "Windows"
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS"
  else if (/android/i.test(ua)) os = "Android"
  else if (/mac os/i.test(ua)) os = "macOS"
  else if (/linux/i.test(ua)) os = "Linux"
  return { device, browser, os }
}

function DeviceIcon({ device }: { device: string }) {
  switch (device) {
    case "Mobile":
      return <Smartphone className="h-4 w-4" />
    case "Tablet":
      return <Tablet className="h-4 w-4" />
    default:
      return <Monitor className="h-4 w-4" />
  }
}

const ACTION_LABELS: Record<string, string> = {
  registration: "Registered",
  login: "Sign-in",
  login_failed: "Failed sign-in",
  logout: "Signed out",
  session_revoked: "Session revoked",
  all_sessions_revoked: "Signed out everywhere",
  password_changed: "Password changed",
  password_reset: "Password reset",
  email_verified: "Email verified",
  mfa_enabled: "MFA enabled",
  mfa_disabled: "MFA disabled",
  mfa_failed: "MFA failed",
  recovery_code_used: "Recovery code used",
  recovery_codes_regenerated: "Recovery codes regenerated",
}

const ACTION_TINTS: Record<string, string> = {
  registration: "text-emerald-600 bg-emerald-50/80",
  login: "text-blue-600 bg-blue-50/80",
  login_failed: "text-red-600 bg-red-50/80",
  logout: "text-muted-foreground bg-muted/50",
  session_revoked: "text-orange-600 bg-orange-50/80",
  all_sessions_revoked: "text-orange-600 bg-orange-50/80",
  password_changed: "text-violet-600 bg-violet-50/80",
  password_reset: "text-violet-600 bg-violet-50/80",
  email_verified: "text-emerald-600 bg-emerald-50/80",
  mfa_enabled: "text-emerald-600 bg-emerald-50/80",
  mfa_disabled: "text-muted-foreground bg-muted/50",
  mfa_failed: "text-red-600 bg-red-50/80",
  recovery_code_used: "text-amber-600 bg-amber-50/80",
  recovery_codes_regenerated: "text-amber-600 bg-amber-50/80",
}

const TAB_ITEMS = [
  { value: "sessions", label: "Sessions", icon: KeyRound },
  { value: "events", label: "Security Events", icon: Activity },
] as const

export default function AdminAuthPage() {
  const stats = useQuery(api.authAdmin.adminStats)
  const sessions = useQuery(api.authAdmin.listAllSessions, { limit: 100 })
  const events = useQuery(api.authAdmin.listAllSecurityEvents, { limit: 100 })
  const revokeSession = useMutation(api.authAdmin.revokeAnySession)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"sessions" | "events">("sessions")
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, 300)
  const [nowTs] = useState(() => Date.now())

  const handleRevoke = async () => {
    if (!confirmRevoke) return
    setRevoking(confirmRevoke)
    try {
      await revokeSession({ sessionId: confirmRevoke as never })
      toast.success("Session revoked")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to revoke session"
      )
    } finally {
      setRevoking(null)
      setConfirmRevoke(null)
    }
  }

  const filteredSessions = useMemo(
    () =>
      sessions?.filter((s) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          (s.email?.toLowerCase().includes(q) ?? false) ||
          (s.name?.toLowerCase().includes(q) ?? false) ||
          (s.ipAddress?.toLowerCase().includes(q) ?? false)
        )
      }) ?? [],
    [sessions, search]
  )

  const filteredEvents = useMemo(
    () =>
      events?.filter((e) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          (e.email?.toLowerCase().includes(q) ?? false) ||
          e.action.toLowerCase().includes(q) ||
          (e.ipAddress?.toLowerCase().includes(q) ?? false)
        )
      }) ?? [],
    [events, search]
  )

  const loading =
    stats === undefined || sessions === undefined || events === undefined

  const failedLogins =
    events?.filter((e) => e.action === "login_failed").length ?? 0

  const statCards = [
    {
      label: "Active Sessions",
      value: stats?.sessions ?? 0,
      icon: KeyRound,
      tint: "text-primary bg-primary/5",
      footnote: "Currently online",
    },
    {
      label: "Events (24h)",
      value: stats?.events24h ?? 0,
      icon: Activity,
      tint: "text-blue-600 bg-blue-50/80",
      footnote: "Last 24 hours",
    },
    {
      label: "Active Users",
      value: stats?.activeUsers ?? 0,
      icon: Users,
      tint: "text-emerald-600 bg-emerald-50/80",
      footnote: "Unique this week",
    },
    {
      label: "Failed Logins",
      value: failedLogins,
      icon: Ban,
      tint: failedLogins > 5 ? "text-red-600 bg-red-50/80" : "text-muted-foreground bg-muted/50",
      footnote: failedLogins > 5 ? "Needs attention" : "Last 24 hours",
      alert: failedLogins > 5,
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
              <a href="/admin" className="transition-colors hover:text-white/80">
                Dashboard
              </a>
              <ArrowRight className="h-3 w-3" />
              <span className="text-white/70">Auth & Security</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Auth & Security
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Monitor sessions and security events across all accounts
            </p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder={
                activeTab === "sessions"
                  ? "Search sessions..."
                  : "Search events..."
              }
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/15"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
                  {loading ? (
                    <span className="inline-block h-6 w-16 animate-pulse rounded bg-muted" />
                  ) : (
                    s.value
                  )}
                </p>
                {s.alert && (
                  <span className="flex items-center gap-1 rounded-full bg-red-50/80 px-2 py-0.5 text-[10px] font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    High
                  </span>
                )}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {s.footnote}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "sessions" | "events")}
        >
          <div className="rounded-2xl border border-border/70 bg-white p-1 shadow-card">
            <TabsList className="h-auto gap-1 bg-transparent p-0">
              {TAB_ITEMS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.value === "sessions" && filteredSessions.length > 0 && (
                    <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                      {filteredSessions.length}
                    </span>
                  )}
                  {tab.value === "events" && filteredEvents.length > 0 && (
                    <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                      {filteredEvents.length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="sessions" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
                    <Shield className="h-4 w-4" />
                  </span>
                  <CardTitle>Active & Recent Sessions</CardTitle>
                </div>
                <CardDescription>
                  All sessions across accounts. Revoking signs the user out on
                  that device.
                </CardDescription>
                <CardAction>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {filteredSessions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <KeyRound className="mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium">
                          {search
                            ? "No sessions match your search."
                            : "No sessions recorded yet."}
                        </p>
                      </div>
                    ) : (
                      filteredSessions.map((s) => {
                        const device = parseDevice(s.userAgent)
                        const expired =
                          !s.revoked && s.absoluteExpiresAt < nowTs
                        const status = s.revoked
                          ? "revoked"
                          : expired
                            ? "expired"
                            : "active"
                        return (
                          <div
                            key={s._id}
                            className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                status === "active"
                                  ? "text-emerald-600 bg-emerald-50/80"
                                  : status === "revoked"
                                    ? "text-red-600 bg-red-50/80"
                                    : "text-muted-foreground bg-muted/50"
                              )}
                            >
                              <DeviceIcon device={device.device} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {s.name ?? s.email}
                                </p>
                                {status === "active" && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                )}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {s.email}
                              </p>
                              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {device.browser}, {device.os}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {s.ipAddress ?? "Unknown"}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="flex items-center gap-1.5">
                                {status === "active" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Active
                                  </span>
                                ) : status === "revoked" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50/80 px-2 py-0.5 text-[11px] font-medium text-red-600">
                                    <XCircle className="h-3 w-3" />
                                    Revoked
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    Expired
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {timeAgo(s.lastActiveAt)}
                              </p>
                            </div>
                            {status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 opacity-0 transition-opacity hover:text-red-700 hover:bg-red-50 group-hover:opacity-100"
                                disabled={revoking === s._id}
                                onClick={() => setConfirmRevoke(s._id)}
                              >
                                {revoking === s._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Revoke"
                                )}
                              </Button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
                    <Activity className="h-4 w-4" />
                  </span>
                  <CardTitle>Security Events</CardTitle>
                </div>
                <CardDescription>
                  Login, MFA, password, and session events across all accounts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {filteredEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Shield className="mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium">
                          {search
                            ? "No events match your search."
                            : "No security events yet."}
                        </p>
                      </div>
                    ) : (
                      filteredEvents.map((e) => (
                        <div
                          key={e._id}
                          className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                              e.result === "success"
                                ? "text-emerald-600 bg-emerald-50/80"
                                : "text-red-600 bg-red-50/80"
                            )}
                          >
                            {e.result === "success" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {ACTION_LABELS[e.action] ?? e.action}
                              </p>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                  ACTION_TINTS[e.action] ??
                                    "text-muted-foreground bg-muted/50"
                                )}
                              >
                                {e.result}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {e.email ?? "—"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(e.createdAt)}
                            </p>
                            {e.ipAddress && (
                              <p className="font-mono text-xs text-muted-foreground">
                                {e.ipAddress}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <ConfirmDialog
        open={confirmRevoke !== null}
        onOpenChange={(open) => {
          if (!open && revoking === null) setConfirmRevoke(null)
        }}
        title="Revoke this session?"
        description="The user will be signed out on that device immediately. They will need to sign in again to continue. Pending work on that device may be lost."
        confirmLabel="Revoke session"
        destructive
        onConfirm={handleRevoke}
      />
    </div>
  )
}
