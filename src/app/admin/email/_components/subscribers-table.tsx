"use client"

import { MailPlus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatTimeAgo } from "../lib/format"
import type { Subscriber } from "../types"

function initials(email: string, name?: string): string {
  const source = name?.trim() || email.trim()
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

interface SubscribersTableProps {
  subscribers: Subscriber[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  onRemove: (s: Subscriber) => void
}

export function SubscribersTable({
  subscribers,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  onRemove,
}: SubscribersTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscribers</CardTitle>
        <CardAction>
          <span className="text-sm text-muted-foreground">{total.toLocaleString()} total</span>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : subscribers.length === 0 ? (
          <EmptyState
            icon={<MailPlus className="h-12 w-12" />}
            title="No subscribers found"
            description="Subscribers appear here when people join your newsletter."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((s) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {initials(s.email, s.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.name || s.email}</p>
                        {s.name && <p className="truncate text-xs text-muted-foreground">{s.email}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.source || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        s.active
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-border bg-muted text-muted-foreground"
                      }
                    >
                      {s.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap text-xs text-muted-foreground"
                    title={formatDate(s.createdAt)}
                  >
                    {formatTimeAgo(s.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon-sm" className="text-destructive" title="Remove" onClick={() => onRemove(s)}>
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
