"use client"

import { AlertTriangle, Loader2, Send, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Campaign } from "../types"

export function SendCampaignDialog({
  open,
  onOpenChange,
  campaign,
  recipientCount,
  busy,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign | null
  recipientCount: number
  busy: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Send campaign?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 rounded-lg border bg-amber-50 p-3 dark:bg-amber-500/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">This sends immediately</p>
              <p className="mt-1 text-xs opacity-80">
                “{campaign?.name ?? "This campaign"}” will be delivered to{" "}
                <strong>{recipientCount.toLocaleString()}</strong> active subscribers. This cannot be
                undone.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteCampaignDialog({
  open,
  onOpenChange,
  campaign,
  busy,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign | null
  busy: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete campaign?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 rounded-lg border bg-red-50 p-3 dark:bg-red-500/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-medium">This action is permanent</p>
              <p className="mt-1 text-xs opacity-80">
                “{campaign?.name ?? "This campaign"}” and its stats will be removed. Delivery history
                for already-sent emails is kept by the email provider.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RemoveSubscriberDialog({
  open,
  onOpenChange,
  email,
  busy,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string | null
  busy: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove subscriber?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 rounded-lg border bg-red-50 p-3 dark:bg-red-500/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-medium">This action is permanent</p>
              <p className="mt-1 text-xs opacity-80">
                <strong>{email}</strong> will be removed from your subscriber list and will stop
                receiving newsletters.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
