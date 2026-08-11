import type { Doc, Id } from "@convex/_generated/dataModel"

export type AuditLog = Doc<"auditLogs">

export interface StatsResult {
  total: number
  byAction: Record<string, number>
  byEntity: Record<string, number>
  byActor: Record<string, number>
  byLevel: Record<string, number>
  bySource: Record<string, number>
  recentActivity: AuditLog[]
  errorCount: number
  warningCount: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  slowOpsCount: number
  slowOps: SlowOp[]
  trend: { timestamp: number; count: number }[]
}

export interface SlowOp {
  _id: Id<"auditLogs">
  action: string
  entityType: string
  entityId: string
  summary: string
  latencyMs?: number
  level?: string
  source?: string
  createdAt: number
  actorEmail: string
}

export interface ChangeEntry {
  key: string
  from?: unknown
  to?: unknown
  value?: unknown
}
