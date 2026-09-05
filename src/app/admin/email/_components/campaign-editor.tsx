"use client"

import { useState } from "react"
import { Code2, Eye, Loader2, Send, X } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { Campaign } from "../types"

export interface CampaignFormData {
  name: string
  subject: string
  content: string
  status: "draft" | "scheduled"
  scheduledAt?: number
}

const VARIABLES = ["{{subscriberName}}", "{{name}}"]

function toDatetimeLocal(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(value: string): number {
  return new Date(value).getTime()
}

function buildPreviewDoc(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #F4F6FA; color: #2A3548; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
  .header { background: #0b2545; padding: 32px; text-align: center; }
  .header h1 { color: #ffffff; font-size: 24px; margin: 0; }
  .content { padding: 32px; line-height: 1.6; }
  .content h1, .content h2, .content h3 { color: #0b2545; }
  .content a { color: #B8860B; }
  .footer { padding: 24px 32px; background: #EEF1F6; text-align: center; font-size: 12px; color: #5D6B7E; }
  img { max-width: 100%; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>TrueWorks</h1></div>
    <div class="content">${content}</div>
    <div class="footer"><p>TrueWorks Limited | Kampala, Uganda</p></div>
  </div>
</body>
</html>`
}

interface CampaignEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign | null
  initial?: CampaignFormData
  saving: boolean
  onSave: (data: CampaignFormData) => void
  onSaveAndSend?: (data: CampaignFormData) => void
}

export function CampaignEditor({ open, onOpenChange, campaign, initial, saving, onSave, onSaveAndSend }: CampaignEditorProps) {
  const [form, setForm] = useState<CampaignFormData>(
    initial ?? {
      name: "",
      subject: "",
      content: "",
      status: "draft",
    }
  )
  const [view, setView] = useState<"edit" | "preview">("edit")

  const handleSave = () => {
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error("Name and subject are required")
      return
    }
    if (form.status === "scheduled" && !form.scheduledAt) {
      toast.error("Pick a send time for a scheduled campaign")
      return
    }
    onSave(form)
  }

  const set = <K extends keyof CampaignFormData>(key: K, value: CampaignFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{campaign ? "Edit Campaign" : "New Campaign"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input
              placeholder="e.g. July Newsletter"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Subject Line</Label>
            <Input
              placeholder="e.g. New Products & Updates"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Content (HTML)</Label>
            <div className="flex items-center gap-1">
              <Button
                variant={view === "edit" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("edit")}
              >
                <Code2 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <Button
                variant={view === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("preview")}
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> Preview
              </Button>
            </div>
          </div>

          {view === "edit" ? (
            <Textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Write your newsletter HTML. You can also use variables below."
              className="min-h-[220px] font-mono text-xs"
            />
          ) : (
            <div className="h-[240px] overflow-hidden rounded-lg border bg-white">
              <iframe
                title="Campaign preview"
                sandbox=""
                srcDoc={buildPreviewDoc(form.content)}
                className="h-full w-full"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Insert variable:</span>
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => set("content", form.content + v)}
                className="rounded-md border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as CampaignFormData["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.status === "scheduled" && (
            <div className="space-y-2">
              <Label>Send At</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt ? toDatetimeLocal(form.scheduledAt) : ""}
                onChange={(e) =>
                  e.target.value
                    ? set("scheduledAt", fromDatetimeLocal(e.target.value))
                    : set("scheduledAt", undefined)
                }
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          {onSaveAndSend && (
            <Button variant="secondary" onClick={() => onSaveAndSend(form)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Save & Send
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {campaign ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
