"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Loader2, Shield, Activity, Users, XCircle, KeyRound, Globe,
  Search, Monitor, Smartphone, Tablet, MapPin, Clock, AlertTriangle,
  CheckCircle2, RefreshCw
} from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    case "Mobile": return <Smartphone className="h-4 w-4" />
    case "Tablet": return <Tablet className="h-4 w-4" />
    default: return <Monitor className="h-4 w-4" />
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

const ACTION_COLORS: Record<string, string> = {
  registration: "bg-emerald-50 text-emerald-700 border-emerald-200",
  login: "bg-blue-50 text-blue-700 border-blue-200",
  login_failed: "bg-red-50 text-red-700 border-red-200",
  logout: "bg-secondary text-secondary-foreground border-border",
  session_revoked: "bg-orange-50 text-orange-700 border-orange-200",
  all_sessions_revoked: "bg-orange-50 text-orange-700 border-orange-200",
  password_changed: "bg-purple-50 text-purple-700 border-purple-200",
  password_reset: "bg-purple-50 text-purple-700 border-purple-200",
  email_verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mfa_enabled: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mfa_disabled: "bg-secondary text-secondary-foreground border-border",
  mfa_failed: "bg-red-50 text-red-700 border-red-200",
  recovery_code_used: "bg-amber-50 text-amber-700 border-amber-200",
  recovery_codes_regenerated: "bg-amber-50 text-amber-700 border-amber-200",
}

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
      toast.error(e instanceof Error ? e.message : "Failed to revoke session")
    } finally {
      setRevoking(null)
      setConfirmRevoke(null)
    }
  }

  const filteredSessions = useMemo(() =>
    sessions?.filter((s) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (s.email?.toLowerCase().includes(q) ?? false) ||
        (s.name?.toLowerCase().includes(q) ?? false) ||
        (s.ipAddress?.toLowerCase().includes(q) ?? false)
      )
    }) ?? [], [sessions, search])

  const filteredEvents = useMemo(() =>
    events?.filter((e) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (e.email?.toLowerCase().includes(q) ?? false) ||
        e.action.toLowerCase().includes(q) ||
        (e.ipAddress?.toLowerCase().includes(q) ?? false)
      )
    }) ?? [], [events, search])

  const loading = stats === undefined || sessions === undefined || events === undefined

  const failedLogins = events?.filter((e) => e.action === "login_failed").length ?? 0

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auth & Security"
        description="Monitor sessions and security events across all accounts."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Auth & Security" }]}
        action={
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeTab === "sessions" ? "Search sessions..." : "Search events..."}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Active Sessions", value: stats?.sessions ?? 0, icon: KeyRound, color: "text-primary", bg: "bg-primary/10", trend: null },
          { label: "Events (24h)", value: stats?.events24h ?? 0, icon: Activity, color: "text-blue-600", bg: "bg-blue-50", trend: null },
          { label: "Active Users", value: stats?.activeUsers ?? 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", trend: null },
          { label: "Failed Logins", value: failedLogins, icon: XCircle, color: "text-red-600", bg: "bg-red-50", trend: failedLogins > 5 ? "up" : null },
        ].map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn("rounded-lg p-2", s.bg)}>
                  <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
                {s.trend === "up" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    High
                  </span>
                )}
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sessions" | "events")}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="sessions" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Sessions
              {filteredSessions.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {filteredSessions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Activity className="h-4 w-4" />
              Security Events
              {filteredEvents.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {filteredEvents.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Active & Recent Sessions
                    </CardTitle>
                    <CardDescription>All sessions across accounts. Revoking signs the user out on that device.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {filteredSessions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <KeyRound className="h-10 w-10 text-muted-foreground/40 mb-3" />
                        <p className="text-sm font-medium">{search ? "No sessions match your search." : "No sessions recorded yet."}</p>
                      </div>
                    ) : (
                      filteredSessions.map((s) => {
                        const device = parseDevice(s.userAgent)
                        const expired = !s.revoked && s.absoluteExpiresAt < nowTs
                        const status = s.revoked ? "revoked" : expired ? "expired" : "active"
                        return (
                          <div key={s._id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                            <div className={cn(
                              "rounded-lg p-2 shrink-0",
                              status === "active" ? "bg-emerald-50" : status === "revoked" ? "bg-red-50" : "bg-muted"
                            )}>
                              <DeviceIcon device={device.device} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{s.name ?? s.email}</p>
                                {status === "active" && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{s.email}</p>
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
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1.5">
                                {status === "active" ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Active
                                  </Badge>
                                ) : status === "revoked" ? (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Revoked
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border gap-1">
                                    <Clock className="h-3 w-3" />
                                    Expired
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 justify-end">
                                  <Clock className="h-3 w-3" />
                                  {timeAgo(s.lastActiveAt)}
                                </span>
                              </p>
                            </div>
                            {status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={revoking === s._id}
                                onClick={() => setConfirmRevoke(s._id)}
                              >
                                {revoking === s._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Revoke"}
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
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Security Events
                    </CardTitle>
                    <CardDescription>Login, MFA, password, and session events across all accounts.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {filteredEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Shield className="h-10 w-10 text-muted-foreground/40 mb-3" />
                        <p className="text-sm font-medium">{search ? "No events match your search." : "No security events yet."}</p>
                      </div>
                    ) : (
                      filteredEvents.map((e) => (
                        <div key={e._id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                          <div className={cn(
                            "rounded-full p-2 shrink-0",
                            e.result === "success" ? "bg-emerald-50" : "bg-red-50"
                          )}>
                            {e.result === "success" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{ACTION_LABELS[e.action] ?? e.action}</p>
                              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", ACTION_COLORS[e.action] ?? "bg-secondary text-secondary-foreground border-border")}>
                                {e.result}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{e.email ?? "—"}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">{fmtDate(e.createdAt)}</p>
                            {e.ipAddress && (
                              <p className="text-xs text-muted-foreground font-mono">{e.ipAddress}</p>
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
        onOpenChange={(open) => { if (!open && revoking === null) setConfirmRevoke(null) }}
        title="Revoke this session?"
        description="The user will be signed out on that device immediately. They will need to sign in again to continue. Pending work on that device may be lost."
        confirmLabel="Revoke session"
        destructive
        onConfirm={handleRevoke}
      />
    </div>
  )
}
