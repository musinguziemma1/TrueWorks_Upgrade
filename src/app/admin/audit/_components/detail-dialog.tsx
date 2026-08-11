"use client"

import { useState } from "react"
import { ArrowRight, Check, Copy, Fingerprint, Network, Timer } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { actionStyle, formatDateTime, formatLatency, initials, latencyColor, levelStyle, SOURCE_LABELS } from "../lib/format"
import type { AuditLog, ChangeEntry } from "../types"

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  )
}

function parseChanges(changes: unknown): ChangeEntry[] {
  if (!changes || typeof changes !== "object") return []
  const obj = changes as Record<string, unknown>
  const entries: ChangeEntry[] = []
  for (const [key, value] of Object.entries(obj)) {
    if (key === "from" || key === "to") continue
    if (obj.from !== undefined || obj.to !== undefined) {
      if (key === "from") continue
      continue
    }
    entries.push({ key, value })
  }
  if (obj.from !== undefined || obj.to !== undefined) {
    entries.unshift({ key: "change", from: obj.from, to: obj.to })
  }
  return entries
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value
  if (value == null) return "—"
  try {
    const s = JSON.stringify(value, null, 2)
    return s.length > 1200 ? `${s.slice(0, 1200)}…` : s
  } catch {
    return String(value)
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function DetailDialog({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  if (!log) return null
  const { className: actionCls, icon: ActionIcon } = actionStyle(log.action)
  const { className: levelCls, icon: LevelIcon } = levelStyle(log.level)
  const changes = parseChanges(log.changes)

  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${actionCls}`}>
              <ActionIcon className="h-3.5 w-3.5" />
              {log.action}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${levelCls}`}>
              <LevelIcon className="h-3.5 w-3.5" />
              {log.level ?? "info"}
            </span>
            {log.source && (
              <Badge variant="outline" className="text-[10px]">
                {SOURCE_LABELS[log.source] ?? log.source}
              </Badge>
            )}
            <DialogTitle className="sr-only">Audit log detail</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Summary */}
          <div>
            <p className="text-sm leading-relaxed">{log.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials(log.actorName ?? undefined, log.actorEmail)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{log.actorName ?? log.actorEmail}</p>
                <p className="truncate text-xs text-muted-foreground">{log.actorEmail}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Entity">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px]">{log.entityType}</span>
                  <span className="max-w-[140px] truncate font-mono text-[11px] text-muted-foreground">{log.entityId}</span>
                  <CopyButton text={log.entityId} label="Copy ID" />
                </div>
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Latency">
                {log.latencyMs != null ? (
                  <p className={`font-mono text-sm font-bold ${latencyColor(log.latencyMs)}`}>
                    {formatLatency(log.latencyMs)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </Field>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Source">
                <p className="flex items-center gap-1 text-sm">
                  <Network className="h-3.5 w-3.5 text-muted-foreground" />
                  {log.source ? (SOURCE_LABELS[log.source] ?? log.source) : "—"}
                </p>
              </Field>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="IP Address">
                {log.ipAddress ? (
                  <p className="flex items-center gap-1 font-mono text-sm">
                    <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                    {log.ipAddress}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </Field>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Timestamp">
                <p className="flex items-center gap-1 text-sm">
                  <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                  {new Date(log.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </Field>
            </div>
          </div>

          {/* Changes */}
          {changes.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Changes</p>
              <div className="space-y-2">
                {changes.map((entry) => (
                  <div key={entry.key} className="overflow-hidden rounded-lg border border-border">
                    <div className="border-b border-border bg-muted/40 px-3 py-1.5 text-xs font-medium">
                      {entry.key === "change" ? "Field updated" : entry.key}
                    </div>
                    {entry.from !== undefined || entry.to !== undefined ? (
                      <div className="flex flex-col gap-1.5 px-3 py-2.5 text-xs sm:flex-row sm:items-center">
                        <span className="rounded bg-muted px-2 py-1 font-mono text-muted-foreground line-through decoration-red-400/70">
                          {stringify(entry.from)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="rounded bg-emerald-500/10 px-2 py-1 font-mono text-emerald-700 dark:text-emerald-400">
                          {stringify(entry.to)}
                        </span>
                      </div>
                    ) : (
                      <div className="px-3 py-2.5 font-mono text-xs">
                        {typeof entry.value === "object" && entry.value !== null ? (
                          <pre className="max-h-44 overflow-x-auto text-[11px] leading-relaxed">
                            {stringify(entry.value)}
                          </pre>
                        ) : (
                          stringify(entry.value)
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && typeof log.metadata === "object" && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Metadata</p>
              <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Stack trace */}
          {log.stackTrace && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Stack Trace</p>
              <pre className="max-h-60 overflow-auto rounded-lg border border-red-200 bg-red-50 p-3 font-mono text-xs leading-relaxed text-red-800 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300">
                {log.stackTrace}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
