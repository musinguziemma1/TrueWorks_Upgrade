"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle, XCircle, Mail, Send, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"

export function EmailTab() {
  const sendTestEmail = useAction(api.testSmtp.sendTestEmail)

  const [testRecipient, setTestRecipient] = useState("")
  const [sending, setSending] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")

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

    </div>
  )
}
