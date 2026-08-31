"use client";

import { useState } from "react";
import { Loader2, Copy, RefreshCw, KeyRound, Clock, Lock, ShieldCheck, Mail, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsField } from "./settings-field";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { SETTING_BY_KEY } from "@convex/settingsSchema";
import { cn } from "@/lib/utils";
import type { SettingsForm } from "../use-settings-form";

const authKeys = ["require2fa", "passwordExpiryDays", "sessionTimeoutMinutes", "maxLoginAttempts"];
const verificationKeys = ["requireVerificationCode", "verificationCodeExpiry", "signOutVerification"];
const apiKeys = ["apiRateLimiting", "ipWhitelist"];

export function SecurityTab({ form }: { form: SettingsForm }) {
  const generateApiKey = useMutation(api.settings.generateApiKey);
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiKeySet = Boolean(form.values.apiKey) && String(form.values.apiKey).length > 0;
  const verificationEnabled = Boolean(form.values.requireVerificationCode);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const key = await generateApiKey();
      setGeneratedKey(key);
      toast.success("New API key generated");
    } catch {
      toast.error("Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("API key copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication & Sessions</CardTitle>
          <CardDescription>Access control and session policies for the TrueWorks IAM system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {authKeys.map((key) => {
              const field = SETTING_BY_KEY[key];
              return (
                <SettingsField
                  key={key}
                  field={field}
                  value={form.values[key] ?? field.default}
                  error={form.errors[key]}
                  onChange={(v) => form.setValue(key, v)}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Sessions are created and revoked server-side. Review active sessions from the Auth &amp; Security admin page.</span>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("border-amber-200", verificationEnabled && "ring-1 ring-amber-200")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>Verification Code Process</CardTitle>
                <CardDescription>Require email verification codes to complete sign-in or sign-out.</CardDescription>
              </div>
            </div>
            {verificationEnabled && (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1">
                <ShieldCheck className="h-3 w-3" /> Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">How it works</p>
                <ul className="mt-1 space-y-1 text-xs text-blue-800">
                  <li>• Admin enters credentials on the sign-in page</li>
                  <li>• A 6-digit verification code is sent to their email</li>
                  <li>• Admin enters the code to complete sign-in</li>
                  <li>• Optional: require verification code to sign out of sessions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {verificationKeys.map((key) => {
              const field = SETTING_BY_KEY[key];
              return (
                <SettingsField
                  key={key}
                  field={field}
                  value={form.values[key] ?? field.default}
                  error={form.errors[key]}
                  onChange={(v) => form.setValue(key, v)}
                />
              );
            })}
          </div>

          {verificationEnabled && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Ensure your email settings (Email tab) are configured so verification codes can be delivered.</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Security</CardTitle>
          <CardDescription>Throttling and access rules for programmatic requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            {apiKeys.map((key) => {
              const field = SETTING_BY_KEY[key];
              return (
                <SettingsField
                  key={key}
                  field={field}
                  value={form.values[key] ?? field.default}
                  error={form.errors[key]}
                  onChange={(v) => form.setValue(key, v)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>
            Generated server-side with a cryptographically secure PRNG. Shown once — copy it now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Input
                readOnly
                value={generatedKey ?? (apiKeySet ? "••••••••••••••••••••••••••••••••" : "No key generated")}
                className="font-mono pr-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Generate New
              </Button>
              {generatedKey && (
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
            <Lock className="h-4 w-4 shrink-0" />
            <span>This key is stored as a secret. It is never shown again after generation — copy it immediately.</span>
          </div>
          {apiKeySet && !generatedKey && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <KeyRound className="h-4 w-4" />
              <span>A key is currently configured. Generate a new one to rotate it.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
