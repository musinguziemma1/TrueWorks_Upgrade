"use client"

import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { formatTimeAgo, levelStyle, sourceStyle, SOURCE_LABELS } from "../lib/format"
import type { AuditLog } from "../types"

export function ErrorsPanel({
  logs,
  total,
  loading,
  onOpen,
}: {
  logs: AuditLog[]
  total: number
  loading: boolean
  onOpen: (log: AuditLog) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (loading && logs.length === 0) {
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          Error Log ({total.toLocaleString()} errors)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-emerald-600" />}
              title="No errors found"
              description="No error or critical events match your filters."
            />
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => {
              const { className: levelCls, icon: LevelIcon } = levelStyle(log.level)
              const isOpen = expanded === log._id
              return (
                <div key={log._id} className={isOpen ? "bg-muted/30" : undefined}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : log._id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatTimeAgo(log.createdAt)}
                    </span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelCls}`}>
                      <LevelIcon className="h-3 w-3" />
                      {log.level}
                    </span>
                    <span className="shrink-0 font-mono text-xs">{log.action}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{log.summary}</span>
                    {log.source && (
                      <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline-flex ${sourceStyle(log.source)}`}>
                        {SOURCE_LABELS[log.source] ?? log.source}
                      </span>
                    )}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpen(log)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation()
                          onOpen(log)
                        }
                      }}
                      className="shrink-0 cursor-pointer text-xs font-medium text-primary hover:underline"
                    >
                      Details
                    </span>
                  </button>

                  {isOpen && log.stackTrace && (
                    <pre className="mx-4 mb-3 max-h-56 overflow-x-auto rounded-lg border border-red-200 bg-red-50 p-3 font-mono text-xs text-red-800 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300">
                      {log.stackTrace}
                    </pre>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
