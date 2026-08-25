"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, Shield, Activity, Users, XCircle, KeyRound, Globe } from "lucide-react";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";

function fmtDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(ts?: number) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function parseDevice(ua?: string) {
  if (!ua) return { device: "Unknown", browser: "Unknown", os: "Unknown" };
  let device = "Desktop";
  if (/tablet|ipad/i.test(ua)) device = "Tablet";
  else if (/mobile|android|iphone|ipod/i.test(ua)) device = "Mobile";
  let browser = "Unknown";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\//i.test(ua)) browser = "Opera";
  else if (/chrome\//i.test(ua)) browser = "Chrome";
  else if (/safari\//i.test(ua)) browser = "Safari";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  return { device, browser, os };
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
};

export default function AdminAuthPage() {
  const stats = useQuery(api.authAdmin.adminStats);
  const sessions = useQuery(api.authAdmin.listAllSessions, { limit: 100 });
  const events = useQuery(api.authAdmin.listAllSecurityEvents, { limit: 100 });
  const revokeSession = useMutation(api.authAdmin.revokeAnySession);
  const [revoking, setRevoking] = useState<string | null>(null);
  // Captured once per mount so expiry checks stay pure during render.
  const [nowTs] = useState(() => Date.now());

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this session? The user will be signed out on that device.")) return;
    setRevoking(id);
    try {
      await revokeSession({ sessionId: id as never });
      toast.success("Session revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  };

  const loading = stats === undefined || sessions === undefined || events === undefined;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auth & Security"
        description="Monitor sessions and security events across all accounts."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Auth & Security" }]}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Active Sessions", value: stats?.sessions ?? 0, icon: KeyRound, color: "text-[#0B2545]" },
          { label: "Events (24h)", value: stats?.events24h ?? 0, icon: Activity, color: "text-[#3E6990]" },
          { label: "Active Users", value: stats?.activeUsers ?? 0, icon: Users, color: "text-emerald-600" },
          { label: "Failed Logins (24h)", value: (events ?? []).filter((e) => e.action === "login_failed").length, icon: XCircle, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
        </div>
      ) : (
        <Tabs defaultValue="sessions">
          <TabsList>
            <TabsTrigger value="sessions"><KeyRound className="h-4 w-4 mr-1.5" /> Sessions</TabsTrigger>
            <TabsTrigger value="events"><Activity className="h-4 w-4 mr-1.5" /> Security Events</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-[#3E6990]" />
                  Active & Recent Sessions
                </CardTitle>
                <CardDescription>All sessions across accounts. Revoking signs the user out on that device.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted">No sessions recorded yet.</TableCell></TableRow>
                      ) : sessions.map((s) => {
                        const device = parseDevice(s.userAgent);
                        const expired = !s.revoked && s.absoluteExpiresAt < nowTs;
                        return (
                          <TableRow key={s._id}>
                            <TableCell>
                              <p className="font-medium">{s.name ?? s.email}</p>
                              <p className="text-xs text-muted-foreground">{s.email}</p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5" />
                                {device.device} · {device.browser} · {device.os}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{s.ipAddress ?? "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{timeAgo(s.createdAt)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{timeAgo(s.lastActiveAt)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{expired ? "Expired" : timeAgo(s.absoluteExpiresAt)}</TableCell>
                            <TableCell className="text-center">
                              {s.revoked ? <StatusBadge status="revoked" /> : expired ? <StatusBadge status="expired" /> : <StatusBadge status="active" />}
                            </TableCell>
                            <TableCell className="text-right">
                              {!s.revoked && !expired && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  disabled={revoking === s._id}
                                  onClick={() => handleRevoke(s._id)}
                                >
                                  {revoking === s._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                  Revoke
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-[#3E6990]" />
                  Security Events
                </CardTitle>
                <CardDescription>Login, MFA, password, and session events across all accounts.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted">No security events yet.</TableCell></TableRow>
                      ) : events.map((e) => (
                        <TableRow key={e._id}>
                          <TableCell>
                            <p className="text-sm font-medium">{e.email ?? "—"}</p>
                          </TableCell>
                          <TableCell className="text-sm">{ACTION_LABELS[e.action] ?? e.action}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={e.result === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                              {e.result}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{e.ipAddress ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(e.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}