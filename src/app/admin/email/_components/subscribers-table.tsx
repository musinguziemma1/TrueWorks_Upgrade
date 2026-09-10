"use client"

import { MailPlus, Trash2, Users, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatTimeAgo } from "../lib/format"
import type { Subscriber } from "../types"
import { cn } from "@/lib/utils"

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
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
            <Users className="h-4 w-4" />
          </span>
          <CardTitle>Subscribers</CardTitle>
        </div>
        <CardAction>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            {total.toLocaleString()} total
          </span>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 text-primary">Subscriber</TableHead>
                  <TableHead className="text-primary">Source</TableHead>
                  <TableHead className="text-primary">Status</TableHead>
                  <TableHead className="text-primary">Subscribed</TableHead>
                  <TableHead className="w-16 text-right text-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((s) => (
                  <TableRow
                    key={s._id}
                    className="group transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/5 text-[11px] font-semibold text-primary">
                          {initials(s.email, s.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {s.name || s.email}
                          </p>
                          {s.name && (
                            <p className="truncate text-xs text-muted-foreground">
                              {s.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.source || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          s.active
                            ? "bg-emerald-50/80 text-emerald-600"
                            : "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell
                      className="whitespace-nowrap text-xs text-muted-foreground"
                      title={formatDate(s.createdAt)}
                    >
                      {formatTimeAgo(s.createdAt)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Remove"
                          onClick={() => onRemove(s)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
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
