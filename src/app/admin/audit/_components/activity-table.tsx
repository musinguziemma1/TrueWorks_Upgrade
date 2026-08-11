"use client"

import { ChevronLeft, ChevronRight, Shield } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatTimeAgo, actionStyle, levelStyle, SOURCE_LABELS, sourceStyle, initials } from "../lib/format"
import type { AuditLog } from "../types"

function ActorCell({ log }: { log: AuditLog }) {
  const name = log.actorName ?? log.actorEmail
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-6">
        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
          {initials(log.actorName ?? undefined, log.actorEmail)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{log.actorEmail}</p>
      </div>
    </div>
  )
}

export function ActivityTable({
  logs,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  onOpen,
}: {
  logs: AuditLog[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  onOpen: (log: AuditLog) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (loading && logs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-baseline justify-between text-base">
          <span>Activity Log</span>
          <span className="text-xs font-normal text-muted-foreground">
            {total.toLocaleString()} event{total === 1 ? "" : "s"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Shield className="h-8 w-8" />}
              title="No audit logs found"
              description="No events match your current filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Time</TableHead>
                  <TableHead className="w-[80px]">Level</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-[120px]">Actor</TableHead>
                  <TableHead className="w-[90px]">Source</TableHead>
                  <TableHead className="w-[90px]">Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const { className: actionCls, icon: ActionIcon } = actionStyle(log.action)
                  const { className: levelCls, icon: LevelIcon } = levelStyle(log.level)
                  return (
                    <TableRow key={log._id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(log)}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTimeAgo(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelCls}`}>
                          <LevelIcon className="h-3 w-3" />
                          {log.level ?? "info"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${actionCls}`}>
                          <ActionIcon className="h-3 w-3" />
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-sm">{log.summary}</TableCell>
                      <TableCell>
                        <ActorCell log={log} />
                      </TableCell>
                      <TableCell>
                        {log.source ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${sourceStyle(log.source)}`}>
                            {SOURCE_LABELS[log.source] ?? log.source}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {log.entityType}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v ?? 25))}>
              <SelectTrigger className="h-7 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((s) => (
                  <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              Page {page} of {totalPages} · {total.toLocaleString()} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
