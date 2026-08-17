"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle, XCircle, Mail, Send, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SettingsField } from "./settings-field"
import { useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"
import { SETTING_BY_KEY } from "@convex/settingsSchema"
import type { SettingsForm } from "../use-settings-form"

const smtpFields = ["smtpHost", "smtpPort", "smtpUsername", "smtpPassword", "smtpFrom"]

export function EmailTab({ form }: { form: SettingsForm }) {
  const sendTestEmail = useAction(api.testSmtp.sendTestEmail)
  const testSmtp = useAction(api.testSmtp.testSmtp)

  const [testRecipient, setTestRecipient] = useState("")
  const [sending, setSending] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")
  const [smtpTesting, setSmtpTesting] = useState(false)
  const [smtpStatus, setSmtpStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSendTest = async () => {
    if (!testRecipient.trim()) {
      toast.error("Enter a recipient email address")
      return
    }
    setSending(true)
    setTestStatus("idle")
    try {
      const result = await sendTestEmail({ to: testRecipient.trim() })
      setTestStatus(result.success ? "success" : "error")
      setTestMessage(result.message)
      if (result.success) toast.success(result.message)
      else toast.error(result.message)
    } catch {
      setTestStatus("error")
      setTestMessage("Failed to send test email")
      toast.error("Failed to send test email")
    } finally {
      setSending(false)
    }
  }

  const handleTestSmtp = async () => {
    const host = String(form.values.smtpHost ?? "")
    const port = Number(form.values.smtpPort ?? 587)
    if (!host) {
      toast.error("Please configure an SMTP host first")
      return
    }
    setSmtpTesting(true)
    setSmtpStatus("idle")
    try {
      const result = await testSmtp({ host, port })
      setSmtpStatus(result.success ? "success" : "error")
      if (result.success) toast.success(result.message)
      else toast.error(result.message)
    } catch {
      setSmtpStatus("error")
      toast.error("SMTP test failed")
    } finally {
      setSmtpTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Test</CardTitle>
          <CardDescription>
            Send a real test email through your configured provider (Resend) to confirm delivery works end-to-end.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="size-3 text-emerald-600" />
              Provider: Resend
            </Badge>
            <span className="text-xs text-muted-foreground">Transactional email is delivered via the RESEND_API_KEY environment variable.</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <div className="flex-1 space-y-2">
              <Label htmlFor="test-recipient">Recipient Email</Label>
              <Input
                id="test-recipient"
                type="email"
                placeholder="you@example.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
              />
            </div>
            <Button className="sm:self-end" onClick={handleSendTest} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Test Email
            </Button>
          </div>
          {testStatus !== "idle" && (
            <div className={`flex items-center gap-2 text-sm ${testStatus === "success" ? "text-emerald-600" : "text-destructive"}`}>
              {testStatus === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>{testMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Customize the subject lines and HTML bodies of transactional emails, with live preview and variable insertion.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/email?tab=templates">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Manage Templates
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>
            Optional direct SMTP settings. These are stored for future use — current delivery routes through Resend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {smtpFields.map((key) => {
              const field = SETTING_BY_KEY[key]
              return (
                <SettingsField
                  key={key}
                  field={field}
                  value={form.values[key] ?? field.default}
                  error={form.errors[key]}
                  onChange={(v) => form.setValue(key, v)}
                />
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={smtpTesting}
            onClick={handleTestSmtp}
          >
            {smtpTesting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Testing...</>
            ) : smtpStatus === "success" ? (
              <><CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Reachable</>
            ) : smtpStatus === "error" ? (
              <><XCircle className="h-4 w-4 mr-2 text-destructive" /> Unreachable</>
            ) : (
              "Test SMTP Reachability"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
