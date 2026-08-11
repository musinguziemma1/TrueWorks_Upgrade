"use client"

import { Zap } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLatency, formatTimeAgo, latencyColor, sourceStyle, SOURCE_LABELS } from "../lib/format"
import type { SlowOp } from "../types"

function PercentileCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 font-heading text-lg font-bold ${color}`}>{value > 0 ? formatLatency(value) : "—"}</p>
    </div>
  )
}

export function PerformancePanel({
  slowOps,
  p50,
  p95,
  p99,
  total,
  loading,
  onOpen,
}: {
  slowOps: SlowOp[]
  p50: number
  p95: number
  p99: number
  total: number
  loading: boolean
  onOpen: (log: SlowOp) => void
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PercentileCard label="P50 Latency" value={p50} color="text-primary" />
        <PercentileCard label="P95 Latency" value={p95} color="text-amber-600 dark:text-amber-400" />
        <PercentileCard label="P99 Latency" value={p99} color="text-red-600 dark:text-red-400" />
        <PercentileCard label="Tracked Ops" value={total} color="text-primary" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Slow Operations ({slowOps.length})
          </CardTitle>
          <CardDescription>Operations exceeding the 2s threshold, sorted by latency.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {slowOps.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Zap className="h-8 w-8 text-emerald-600" />}
                title="No slow operations"
                description="No operations exceeded the latency threshold in this period."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="w-[100px]">Latency</TableHead>
                    <TableHead className="w-[90px]">Source</TableHead>
                    <TableHead className="w-[150px]">Actor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slowOps.map((op) => (
                    <TableRow key={op._id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(op)}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTimeAgo(op.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap font-mono text-xs">{op.action}</span>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-sm">{op.summary}</TableCell>
                      <TableCell>
                        <span className={`font-mono text-sm font-bold ${latencyColor(op.latencyMs ?? 0)}`}>
                          {formatLatency(op.latencyMs ?? 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {op.source ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${sourceStyle(op.source)}`}>
                            {SOURCE_LABELS[op.source] ?? op.source}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{op.actorEmail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
