"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"

const DAY_MS = 24 * 60 * 60 * 1000

const RETENTION_OPTIONS = [
  { value: 30, label: "Older than 30 days" },
  { value: 90, label: "Older than 90 days" },
  { value: 180, label: "Older than 6 months" },
  { value: 365, label: "Older than 1 year" },
]

export function RetentionCard() {
  const cleanup = useMutation(api.auditLogs.cleanup)
  const [retentionDays, setRetentionDays] = useState(90)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [purging, setPurging] = useState(false)

  const handlePurge = async () => {
    setPurging(true)
    try {
      const deleted = await cleanup({ olderThan: retentionDays * DAY_MS })
      setConfirmOpen(false)
      toast.success(`Deleted ${deleted.toLocaleString()} audit log${deleted === 1 ? "" : "s"}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Purge failed")
    } finally {
      setPurging(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          Retention & Cleanup
        </CardTitle>
        <CardDescription>Permanently delete old audit logs to keep the table lean.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={String(retentionDays)} onValueChange={(v) => setRetentionDays(Number(v ?? 90))}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RETENTION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Purge Logs
        </Button>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Purge audit logs?
            </DialogTitle>
            <DialogDescription>
              This permanently deletes all audit logs {RETENTION_OPTIONS.find((o) => o.value === retentionDays)?.label.toLowerCase()}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={purging}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handlePurge} disabled={purging}>
              {purging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {purging ? "Purging…" : "Purge permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
