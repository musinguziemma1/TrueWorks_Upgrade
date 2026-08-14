import { action, internalQuery, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { sanitizeSearch } from "./lib/sanitize";

const EXPORT_MAX_ROWS = 10_000;

interface ExportFilters {
  entityType?: string;
  action?: string;
  actorEmail?: string;
  search?: string;
  startDate?: number;
  endDate?: number;
  days?: number;
  level?: string;
  source?: string;
  limit?: number;
}

type AuditLogLevel = "info" | "warning" | "error" | "critical";
type AuditLogSource = "mutation" | "query" | "http" | "webhook" | "action" | "scheduler";

interface ExportResult {
  csv: string;
  count: number;
  truncated: boolean;
}

interface ExportRow {
  createdAt: number;
  level?: string;
  source?: string;
  action: string;
  entityType: string;
  entityId: string;
  actorEmail: string;
  actorName?: string;
  summary: string;
  latencyMs?: number;
  ipAddress?: string;
}

function escapeCsv(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Internal (server-only) collector for CSV export — applies the same filters
 * as `list` and returns the raw docs so an action can build the file.
 * Lives in its own module to avoid a circular api.<module> self-reference.
 */
export const listForExport = internalQuery({
  args: {
    entityType: v.optional(v.string()),
    action: v.optional(v.string()),
    actorEmail: v.optional(v.string()),
    search: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    days: v.optional(v.number()),
    level: v.optional(v.string()),
    source: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? EXPORT_MAX_ROWS, EXPORT_MAX_ROWS);

    let q = ctx.db.query("auditLogs").withIndex("by_createdAt");
    const startDate =
      args.days && args.days > 0 ? Date.now() - args.days * 24 * 60 * 60 * 1000 : args.startDate;
    if (startDate) q = q.filter((q) => q.gte(q.field("createdAt"), startDate));
    if (args.endDate) q = q.filter((q) => q.lte(q.field("createdAt"), args.endDate!));
    if (args.entityType) q = q.filter((q) => q.eq(q.field("entityType"), args.entityType!));
    if (args.action) q = q.filter((q) => q.eq(q.field("action"), args.action!));
    if (args.actorEmail) q = q.filter((q) => q.eq(q.field("actorEmail"), args.actorEmail!));
    if (args.level) q = q.filter((q) => q.eq(q.field("level"), args.level as AuditLogLevel));
    if (args.source) q = q.filter((q) => q.eq(q.field("source"), args.source as AuditLogSource));

    const all = await q.order("desc").collect();

    let rows = all;
    if (args.search) {
      const s = sanitizeSearch(args.search).toLowerCase();
      rows = all.filter(
        (log) =>
          log.summary.toLowerCase().includes(s) ||
          log.actorEmail.toLowerCase().includes(s) ||
          log.entityType.toLowerCase().includes(s) ||
          log.entityId.toLowerCase().includes(s) ||
          log.action.toLowerCase().includes(s)
      );
    }

    return rows.slice(0, limit);
  },
});

/**
 * Export audit logs matching the current filters to CSV (server-side).
 * Admin-only, capped at EXPORT_MAX_ROWS rows to bound response size.
 * Returns { csv, count, truncated } — the client builds a Blob download.
 */
async function exportCsvHandler(ctx: ActionCtx, args: ExportFilters): Promise<ExportResult> {
  const isAdmin = await ctx.runQuery(api.users.isAdmin, {});
  if (!isAdmin) throw new Error("Unauthorized: Admin access required");

  const limit = Math.min(args.limit ?? EXPORT_MAX_ROWS, EXPORT_MAX_ROWS);
  const rows: ExportRow[] = await ctx.runQuery(internal.auditLogExport.listForExport, {
    entityType: args.entityType,
    action: args.action,
    actorEmail: args.actorEmail,
    search: args.search,
    startDate: args.startDate,
    endDate: args.endDate,
    days: args.days,
    level: args.level,
    source: args.source,
    limit,
  });

  const truncated = rows.length >= limit;
  const header = [
    "createdAt", "level", "source", "action", "entityType", "entityId",
    "actorEmail", "actorName", "summary", "latencyMs", "ipAddress",
  ];

  const lines = [header.join(",")];
  for (const log of rows) {
    lines.push(
      [
        new Date(log.createdAt).toISOString(),
        log.level ?? "info",
        log.source ?? "",
        log.action,
        log.entityType,
        log.entityId,
        log.actorEmail,
        log.actorName ?? "",
        log.summary,
        log.latencyMs ?? "",
        log.ipAddress ?? "",
      ].map(escapeCsv).join(",")
    );
  }

  return { csv: lines.join("\n"), count: rows.length, truncated };
}

export const exportCsv = action({
  args: {
    entityType: v.optional(v.string()),
    action: v.optional(v.string()),
    actorEmail: v.optional(v.string()),
    search: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    days: v.optional(v.number()),
    level: v.optional(v.string()),
    source: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => exportCsvHandler(ctx, args),
});
