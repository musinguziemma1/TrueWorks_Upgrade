import { action, internalQuery, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { sanitizeSearch } from "./lib/sanitize";

const EXPORT_MAX_ROWS = 10_000;

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

interface ExportFilters {
  status?: string;
  provider?: string;
  method?: string;
  search?: string;
  startDate?: number;
  endDate?: number;
  days?: number;
  limit?: number;
}

interface ExportResult {
  csv: string;
  count: number;
  truncated: boolean;
}

interface ExportRow {
  paymentId: string;
  orderId: string;
  provider: string;
  method: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customerEmail: string;
  customerName: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Internal (server-only) collector for CSV export — applies the same filters
 * as `list` and returns raw rows so the action can build the file.
 */
export const listForExport = internalQuery({
  args: {
    status: v.optional(v.string()),
    provider: v.optional(v.string()),
    method: v.optional(v.string()),
    search: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? EXPORT_MAX_ROWS, EXPORT_MAX_ROWS);

    const q = args.status
      ? ctx.db.query("payments").withIndex("by_status", (q) =>
          q.eq("status", args.status as PaymentStatus)
        )
      : ctx.db.query("payments").withIndex("by_createdAt", (q) => q);

    let all = await q.collect();

    const startDate =
      args.days && args.days > 0 ? Date.now() - args.days * 24 * 60 * 60 * 1000 : args.startDate;
    if (startDate) all = all.filter((p) => p.createdAt >= startDate);
    if (args.endDate) all = all.filter((p) => p.createdAt <= args.endDate!);
    if (args.provider) all = all.filter((p) => p.provider === args.provider);
    if (args.method) all = all.filter((p) => p.method === args.method);

    if (args.search) {
      const lower = sanitizeSearch(args.search).toLowerCase();
      all = all.filter(
        (p) =>
          p.paymentId.toLowerCase().includes(lower) ||
          p.customerName.toLowerCase().includes(lower) ||
          p.customerEmail.toLowerCase().includes(lower) ||
          p.orderId.toLowerCase().includes(lower)
      );
    }

    all.sort((a, b) => b.createdAt - a.createdAt);

    return all.slice(0, limit).map((p) => ({
      paymentId: p.paymentId,
      orderId: p.orderId,
      provider: p.provider,
      method: p.method,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      customerEmail: p.customerEmail,
      customerName: p.customerName,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  },
});

/**
 * Export payments matching the current filters to CSV (server-side).
 * Admin-only, capped at EXPORT_MAX_ROWS rows to bound response size.
 * Returns { csv, count, truncated } — the client builds a Blob download.
 */
async function exportCsvHandler(ctx: ActionCtx, args: ExportFilters): Promise<ExportResult> {
  const isAdmin = await ctx.runQuery(api.users.isAdmin, {});
  if (!isAdmin) throw new Error("Unauthorized: Admin access required");

  const limit = Math.min(args.limit ?? EXPORT_MAX_ROWS, EXPORT_MAX_ROWS);
  const rows: ExportRow[] = await ctx.runQuery(internal.paymentsExport.listForExport, {
    status: args.status,
    provider: args.provider,
    method: args.method,
    search: args.search,
    startDate: args.startDate,
    endDate: args.endDate,
    days: args.days,
    limit,
  });

  const truncated = rows.length >= limit;
  const header = [
    "paymentId", "orderId", "provider", "method", "amount", "currency", "status",
    "customerEmail", "customerName", "createdAt", "updatedAt",
  ];

  const lines = [header.join(",")];
  for (const p of rows) {
    lines.push(
      [
        p.paymentId,
        p.orderId,
        p.provider,
        p.method,
        p.amount,
        p.currency,
        p.status,
        p.customerEmail,
        p.customerName,
        new Date(p.createdAt).toISOString(),
        new Date(p.updatedAt).toISOString(),
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  return { csv: lines.join("\n"), count: rows.length, truncated };
}

function escapeCsv(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const exportCsv = action({
  args: {
    status: v.optional(v.string()),
    provider: v.optional(v.string()),
    method: v.optional(v.string()),
    search: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => exportCsvHandler(ctx, args),
});
