"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Globe,
  RefreshCw,
  LogOut,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Monitor,
  Smartphone as SmartphoneIcon,
  Tablet,
  KeyRound,
  Clock,
  MapPin,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { useAuth } from "@/lib/auth/provider";
import { PasskeysCard } from "@/components/auth/passkeys-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
  if (!ua) return { device: "Desktop", browser: "Unknown", os: "Unknown" };
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

function DeviceIcon({ device }: { device: string }) {
  switch (device) {
    case "Mobile": return <SmartphoneIcon className="h-5 w-5" />;
    case "Tablet": return <Tablet className="h-5 w-5" />;
    default: return <Monitor className="h-5 w-5" />;
  }
}

const EVENT_LABELS: Record<string, string> = {
  login: "Signed in",
  login_failed: "Failed sign-in",
  logout: "Signed out",
  registration: "Account created",
  session_revoked: "Session revoked",
  all_sessions_revoked: "Signed out everywhere",
  password_changed: "Password changed",
  password_reset: "Password reset",
  email_verified: "Email verified",
  mfa_enabled: "MFA enabled",
  mfa_disabled: "MFA disabled",
  mfa_failed: "MFA failed",
  passkey_registered: "Passkey added",
  passkey_deleted: "Passkey removed",
  recovery_code_used: "Recovery code used",
  recovery_codes_regenerated: "Recovery codes regenerated",
};

interface SessionRow {
  _id: string;
  createdAt: number;
  lastActiveAt: number;
  absoluteExpiresAt: number;
  revoked: boolean;
  revokedAt?: number;
  ipAddress?: string;
  userAgent?: string;
}

interface EventRow {
  _id: string;
  action: string;
  result: string;
  createdAt: number;
  ipAddress?: string;
  userAgent?: string;
}

export default function SecurityContent() {
  const { user } = useAuth();
  const mfaEnabled = user?.mfaEnabled ?? false;

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [mfaStep, setMfaStep] = useState<"idle" | "setup" | "enter" | "codes">("idle");
  const [mfaSecret, setMfaSecret] = useState("");
  const [_otpauth, setOtpauth] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [nowTs] = useState(() => Date.now());

  const loadSecurity = useCallback(async () => {
    setLoading(true);
    try {
      const [sres, eres] = await Promise.all([
        fetch("/api/auth/sessions", { credentials: "include" }),
        fetch("/api/auth/security-events", { credentials: "include" }),
      ]);
      const sdata = await sres.json().catch(() => null);
      const edata = await eres.json().catch(() => null);
      const sessionsList: SessionRow[] = sdata?.sessions ?? [];
      setSessions(sessionsList);
      setEvents(edata?.events ?? []);
      const active = sessionsList
        .filter((s) => !s.revoked && s.absoluteExpiresAt > Date.now())
        .sort((a, b) => b.lastActiveAt - a.lastActiveAt);
      setCurrentSessionId(active[0]?._id ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => { void loadSecurity(); }, 0);
    return () => window.clearTimeout(t);
  }, [loadSecurity]);

  const revokeSession = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("Session revoked");
        await loadSecurity();
      } else {
        toast.error(data.error ?? "Failed to revoke session");
      }
    } finally {
      setBusy(false);
    }
  };

  const revokeOthers = async () => {
    if (!confirm("Sign out all other devices?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sessions/revoke-others", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("Signed out all other devices");
        await loadSecurity();
      } else {
        toast.error(data.error ?? "Failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const revokeAll = async () => {
    if (!confirm("Sign out on every device, including this one?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sessions/revoke-all", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("Signed out everywhere");
      } else {
        toast.error(data.error ?? "Failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const startMfaSetup = async () => {
    setMfaBusy(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok && data.secret) {
        setMfaSecret(data.secret);
        setOtpauth(data.otpauth);
        setMfaStep("setup");
      } else {
        toast.error(data.error ?? "Failed to start MFA setup");
      }
    } finally {
      setMfaBusy(false);
    }
  };

  const verifyMfa = async () => {
    if (!mfaCode.trim()) return;
    setMfaBusy(true);
    try {
      const res = await fetch("/api/auth/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaCode }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setRecoveryCodes(data.recoveryCodes ?? []);
        setMfaStep("codes");
        toast.success("MFA enabled — save your recovery codes");
      } else {
        toast.error(data.error ?? "Invalid code");
      }
    } finally {
      setMfaBusy(false);
    }
  };

  const disableMfa = async () => {
    if (!disablePassword.trim() || !disableCode.trim()) {
      toast.error("Enter your password and a current MFA code to disable");
      return;
    }
    setMfaBusy(true);
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMfaStep("idle");
        setDisablePassword("");
        setDisableCode("");
        toast.success("MFA disabled");
      } else {
        toast.error(data.error ?? "Failed to disable MFA");
      }
    } finally {
      setMfaBusy(false);
    }
  };

  const regenerateCodes = async () => {
    if (!disablePassword.trim() || !disableCode.trim()) {
      toast.error("Enter your password and a current MFA code to regenerate codes");
      return;
    }
    setMfaBusy(true);
    try {
      const res = await fetch("/api/auth/mfa/regenerate-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setRecoveryCodes(data.recoveryCodes ?? []);
        setMfaStep("codes");
        toast.success("New recovery codes generated");
      } else {
        toast.error(data.error ?? "Failed to regenerate codes");
      }
    } finally {
      setMfaBusy(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeSessions = sessions.filter((s) => !s.revoked && s.absoluteExpiresAt > nowTs);

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-900">MFA Status</p>
                <p className="text-xs text-emerald-700">{mfaEnabled ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Active Sessions</p>
                <p className="text-xs text-blue-700">{activeSessions.length} device{activeSessions.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">Last Activity</p>
                <p className="text-xs text-amber-700">{events.length > 0 ? timeAgo(events[0]?.createdAt) : "No activity"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MFA Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security with an authenticator app.</CardDescription>
              </div>
            </div>
            {mfaEnabled && (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1">
                <CircleCheck className="h-3 w-3" />
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {mfaStep === "idle" && (
            <div className="space-y-4">
              {!mfaEnabled ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-100 p-2">
                      <ShieldAlert className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Protect your account</p>
                      <p className="text-xs text-muted-foreground">MFA adds a second verification step at sign-in.</p>
                    </div>
                  </div>
                  <Button onClick={startMfaSetup} disabled={mfaBusy}>
                    {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
                    Set up MFA
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">MFA is enabled</p>
                      <p className="text-xs text-emerald-700">Your account requires a code from your authenticator app to sign in.</p>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
                    <p className="text-sm font-medium">Manage MFA</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Password</Label>
                        <Input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder="Enter password" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Auth code</Label>
                        <Input value={disableCode} onChange={(e) => setDisableCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={regenerateCodes} disabled={mfaBusy || !disablePassword.trim() || !disableCode.trim()}>
                        {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Regenerate codes
                      </Button>
                      <Button variant="destructive" size="sm" onClick={disableMfa} disabled={mfaBusy || !disablePassword.trim() || !disableCode.trim()}>
                        {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                        Disable MFA
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {mfaStep === "setup" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">Open your authenticator app and enter the setup secret, then verify with the 6-digit code.</p>
              </div>
              <div className="space-y-2">
                <Label>Manual setup secret</Label>
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <code className="font-mono text-sm break-all">{mfaSecret}</code>
                  <Button variant="ghost" size="icon-sm" onClick={() => copyCode(mfaSecret)}>
                    {copied === mfaSecret ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Verification code</Label>
                <Input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" className="max-w-xs" />
              </div>
              <div className="flex gap-2">
                <Button onClick={verifyMfa} disabled={mfaBusy || !mfaCode.trim()}>
                  {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                  Verify & Enable
                </Button>
                <Button variant="outline" onClick={() => setMfaStep("idle")}>Cancel</Button>
              </div>
            </div>
          )}

          {mfaStep === "codes" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">Save these recovery codes somewhere safe. Each can be used once if you lose your authenticator.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {recoveryCodes.map((code) => (
                  <button key={code} onClick={() => copyCode(code)} title="Copy code" className="rounded-lg border bg-muted/50 px-3 py-2.5 font-mono text-xs hover:bg-muted transition-colors text-center">
                    {copied === code ? <Check className="h-3 w-3 inline text-emerald-600 mr-1" /> : <Copy className="h-3 w-3 inline mr-1" />}
                    {code}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={() => setMfaStep("idle")}>Done</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passkeys */}
      <PasskeysCard />

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Devices currently signed in to your account.</CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={revokeOthers} disabled={busy || activeSessions.length <= 1}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Sign out others
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={revokeAll} disabled={busy}>
                <LogOut className="h-4 w-4 mr-1.5" /> Sign out all
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Globe className="h-6 w-6" style={{ color: "#B8860B" }} />
              </div>
              <p className="text-sm font-medium">No active sessions</p>
              <p className="text-xs text-muted-foreground">Your account has no other active sessions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeSessions.map((s) => {
                const device = parseDevice(s.userAgent);
                const isCurrent = s._id === currentSessionId;
                return (
                  <div key={s._id} className={cn("flex items-center justify-between rounded-xl border p-4 transition-colors", isCurrent ? "border-emerald-200 bg-emerald-50/50" : "bg-muted/20 hover:bg-muted/30")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-lg p-2", isCurrent ? "bg-emerald-100 text-emerald-600" : "bg-muted")} style={!isCurrent ? { color: "#B8860B" } : undefined}>
                        <DeviceIcon device={device.device} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{device.device} &middot; {device.browser}</p>
                          {isCurrent && (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0">
                              This device
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.ipAddress ?? "IP hidden"}</span>
                          <span>&middot;</span>
                          <span>Last active {timeAgo(s.lastActiveAt)}</span>
                        </div>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => revokeSession(s._id)} disabled={busy}>
                        Revoke
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Login Activity</CardTitle>
              <CardDescription>Recent security events on your account.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Clock className="h-6 w-6" style={{ color: "#B8860B" }} />
              </div>
              <p className="text-sm font-medium">No recent activity</p>
              <p className="text-xs text-muted-foreground">Your account security events will appear here.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="divide-y">
                {events.slice(0, 20).map((e) => (
                  <div key={e._id} className="flex items-center justify-between py-3 pr-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-full p-1.5", e.result === "success" ? "bg-emerald-100" : "bg-red-100")}>
                        {e.result === "success" ? <CircleCheck className="h-4 w-4 text-emerald-600" /> : <CircleX className="h-4 w-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{EVENT_LABELS[e.action] ?? e.action}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{fmtDate(e.createdAt)}</span>
                          {e.ipAddress && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", e.result === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700")}>
                      {e.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
