"use client";

import { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  Shield,
  Smartphone,
  Globe,
  RefreshCw,
  LogOut,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/lib/auth/provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

  // MFA state
  const [mfaStep, setMfaStep] = useState<"idle" | "setup" | "enter" | "codes">(
    mfaEnabled ? "idle" : "idle"
  );
  const [mfaSecret, setMfaSecret] = useState("");
  const [_otpauth, setOtpauth] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  // Captured once per mount so expiry checks stay pure during render.
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

      // Identify the current session: the most recent active one.
      const active = sessionsList
        .filter((s) => !s.revoked && s.absoluteExpiresAt > Date.now())
        .sort((a, b) => b.lastActiveAt - a.lastActiveAt);
      setCurrentSessionId(active[0]?._id ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer to a macrotask so state updates happen outside the effect body.
    const t = window.setTimeout(() => {
      void loadSecurity();
    }, 0);
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
        <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
      </div>
    );
  }

  const activeSessions = sessions.filter(
    (s) => !s.revoked && s.absoluteExpiresAt > nowTs
  );

  return (
    <div className="space-y-8">
      {/* MFA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-[#3E6990]" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security with an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mfaStep === "idle" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={mfaEnabled ? "active" : "pending"} />
                  <span className="text-sm text-muted-foreground">
                    {mfaEnabled ? "Enabled on this account" : "Not enabled"}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!mfaEnabled ? (
                    <Button onClick={startMfaSetup} disabled={mfaBusy}>
                      {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Smartphone className="h-4 w-4 mr-1" />}
                      Set up
                    </Button>
                  ) : null}
                </div>
              </div>
              {mfaEnabled && (
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    To disable MFA, confirm your password and enter a current code from your authenticator app.
                  </p>
                  <div className="grid max-w-md gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Password</Label>
                      <Input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Auth code</Label>
                      <Input value={disableCode} onChange={(e) => setDisableCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="mt-3" onClick={regenerateCodes} disabled={mfaBusy || !disablePassword.trim() || !disableCode.trim()}>
                      {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                      Regenerate codes
                    </Button>
                    <Button variant="destructive" size="sm" className="mt-3" onClick={disableMfa} disabled={mfaBusy || !disablePassword.trim() || !disableCode.trim()}>
                      {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <LogOut className="h-4 w-4 mr-1" />}
                      Disable MFA
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {mfaStep === "setup" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Open your authenticator app (Google Authenticator, Authy, 1Password…) and scan the
                code, or enter the secret manually, then enter the 6-digit code below.
              </p>
              <div className="rounded-lg border bg-surface p-4">
                <p className="text-xs text-muted-foreground mb-1">Manual setup secret</p>
                <div className="flex items-center justify-between">
                  <code className="font-mono text-sm break-all">{mfaSecret}</code>
                  <Button variant="ghost" size="icon-sm" onClick={() => copyCode(mfaSecret)}>
                    {copied === mfaSecret ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="max-w-xs space-y-2">
                <Label>Verification code</Label>
                <Input
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={verifyMfa} disabled={mfaBusy || !mfaCode.trim()}>
                  {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <KeyRound className="h-4 w-4 mr-1" />}
                  Verify & Enable
                </Button>
                <Button variant="outline" onClick={() => setMfaStep("idle")}>Cancel</Button>
              </div>
            </div>
          )}

          {mfaStep === "codes" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Save these recovery codes somewhere safe. Each can be used once to sign in if you
                  lose your authenticator.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {recoveryCodes.map((code) => (
                  <button
                    key={code}
                    onClick={() => copyCode(code)}
                    title="Copy code"
                    className="rounded-lg border bg-surface px-3 py-2 font-mono text-xs hover:bg-muted transition-colors"
                  >
                    {copied === code ? <Check className="h-3 w-3 inline text-green-600 mr-1" /> : <Copy className="h-3 w-3 inline mr-1" />}
                    {code}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={() => setMfaStep("idle")}>Done</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-[#3E6990]" />
                Active Sessions
              </CardTitle>
              <CardDescription>Devices currently signed in to your account.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={revokeOthers} disabled={busy || activeSessions.length <= 1}>
                <RefreshCw className="h-4 w-4 mr-1" /> Sign out other devices
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={revokeAll} disabled={busy}>
                <LogOut className="h-4 w-4 mr-1" /> Sign out everywhere
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No active sessions.</p>
          ) : activeSessions.map((s) => {
            const device = parseDevice(s.userAgent);
            const isCurrent = s._id === currentSessionId;
            return (
              <div key={s._id} className="flex items-center justify-between rounded-lg border bg-surface p-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-[#0B2545]/10 text-[#0B2545]">
                    <Monitor className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {device.device} · {device.browser} · {device.os}
                      {isCurrent && (
                        <Badge variant="outline" className="ml-2 border-emerald-200 bg-emerald-50 text-emerald-700">
                          This device
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.ipAddress ?? "IP hidden"} · Last active {timeAgo(s.lastActiveAt)} · Signed in {timeAgo(s.createdAt)}
                    </p>
                  </div>
                </div>
                {!isCurrent && (
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => revokeSession(s._id)} disabled={busy}>
                    Revoke
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Login history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-[#3E6990]" />
            Login Activity
          </CardTitle>
          <CardDescription>Recent security events on your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No recent activity.</p>
          ) : (
            <div className="divide-y divide-border">
              {events.slice(0, 20).map((e) => (
                <div key={e._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{EVENT_LABELS[e.action] ?? e.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(e.createdAt)} · {e.ipAddress ?? "IP hidden"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      e.result === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {e.result}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}