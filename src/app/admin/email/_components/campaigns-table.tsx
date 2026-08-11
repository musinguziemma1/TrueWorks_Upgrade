"use client"

import { CalendarClock, Copy, Edit3, Send, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { statusMeta, formatPercent, formatDate, formatTimeAgo, formatCompact } from "../lib/format"
import type { Campaign } from "../types"

interface CampaignsTableProps {
  campaigns: Campaign[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  onEdit: (c: Campaign) => void
  onDuplicate: (c: Campaign) => void
  onSend: (c: Campaign) => void
  onDelete: (c: Campaign) => void
}

function RateCell({ numerator, denominator }: { numerator: number; denominator: number }) {
  const pct = denominator > 0 ? (numerator / denominator) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
        {formatPercent(numerator, denominator)}
      </span>
    </div>
  )
}

function StatusCell({ status }: { status: Campaign["status"] }) {
  const meta = statusMeta(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

export function CampaignsTable({
  campaigns,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDuplicate,
  onSend,
  onDelete,
}: CampaignsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaigns</CardTitle>
        <CardAction>
          <span className="text-sm text-muted-foreground">{total.toLocaleString()} campaigns</span>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={<Send className="h-12 w-12" />}
            title="No campaigns found"
            description="Create your first campaign to start building your audience."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Recipients</TableHead>
                <TableHead>Open rate</TableHead>
                <TableHead>Click rate</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <div className="max-w-[260px]">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.subject}</p>
                      {c.status === "scheduled" && c.scheduledAt && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400">
                          <CalendarClock className="h-3 w-3" />
                          {formatDate(c.scheduledAt)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusCell status={c.status} />
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {c.sentCount > 0 ? formatCompact(c.sentCount) : "—"}
                  </TableCell>
                  <TableCell>
                    <RateCell numerator={c.openCount} denominator={c.sentCount} />
                  </TableCell>
                  <TableCell>
                    <RateCell numerator={c.clickCount} denominator={c.sentCount} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {c.sentAt ? formatTimeAgo(c.sentAt) : formatDate(c.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      {c.status !== "sent" && (
                        <Button variant="ghost" size="icon-sm" title="Send now" onClick={() => onSend(c)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {c.status !== "sent" && (
                        <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => onEdit(c)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-sm" title="Duplicate" onClick={() => onDuplicate(c)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive" title="Delete" onClick={() => onDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {total > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <SelectPageSize pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function SelectPageSize({ pageSize, onPageSizeChange }: { pageSize: number; onPageSizeChange: (s: number) => void }) {
  return (
    <select
      value={pageSize}
      onChange={(e) => onPageSizeChange(Number(e.target.value))}
      className="h-8 rounded-md border bg-background px-2 text-xs text-muted-foreground"
    >
      {[10, 25, 50].map((n) => (
        <option key={n} value={n}>
          {n} / page
        </option>
      ))}
    </select>
  )
}
