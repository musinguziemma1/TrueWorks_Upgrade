import { action, internalQuery, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { sanitizeSearch } from "./lib/sanitize";

const EXPORT_MAX_ROWS = 10_000;

type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

interface ExportFilters {
  search?: string;
  status?: string;
  limit?: number;
}

interface ExportRow {
  name: string;
  subject: string;
  status: CampaignStatus;
  sentCount: number;
  openCount: number;
  clickCount: number;
  openRate: number;
  clickRate: number;
  scheduledAt: number | null;
  sentAt: number | null;
  createdAt: number;
}

interface ExportResult {
  csv: string;
  count: number;
  truncated: boolean;
}

export const listForExport = internalQuery({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? EXPORT_MAX_ROWS, EXPORT_MAX_ROWS);
    let all = await ctx.db.query("campaigns").order("desc").collect();
    if (args.status) all = all.filter((c) => c.status === args.status);
    if (args.search) {
      const l = sanitizeSearch(args.search).toLowerCase();
      all = all.filter(
        (c) =>
          c.name.toLowerCase().includes(l) ||
          c.subject.toLowerCase().includes(l)
      );
    }
    return all.slice(0, limit).map((c) => ({
      name: c.name,
      subject: c.subject,
      status: c.status,
      sentCount: c.sentCount,
      openCount: c.openCount,
      clickCount: c.clickCount,
      openRate: c.sentCount > 0 ? Math.round((c.openCount / c.sentCount) * 1000) / 10 : 0,
      clickRate: c.sentCount > 0 ? Math.round((c.clickCount / c.sentCount) * 1000) / 10 : 0,
      scheduledAt: c.scheduledAt ?? null,
      sentAt: c.sentAt ?? null,
      createdAt: c.createdAt,
    }));
  },
});

async function exportCsvHandler(ctx: ActionCtx, args: ExportFilters): Promise<ExportResult> {
  const isAdmin = await ctx.runQuery(api.users.isAdmin, {});
  if (!isAdmin) throw new Error("Unauthorized: Admin access required");

  const limit = Math.min(args.limit ?? EXPORT_MAX_ROWS, EXPORT_MAX_ROWS);
  const rows: ExportRow[] = await ctx.runQuery(internal.campaignExport.listForExport, {
    search: args.search,
    status: args.status,
    limit,
  });

  const truncated = rows.length >= limit;
  const header = [
    "name", "subject", "status", "sentCount", "openCount", "clickCount",
    "openRate", "clickRate", "scheduledAt", "sentAt", "createdAt",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.name,
        r.subject,
        r.status,
        r.sentCount,
        r.openCount,
        r.clickCount,
        r.openRate,
        r.clickRate,
        r.scheduledAt ? new Date(r.scheduledAt).toISOString() : "",
        r.sentAt ? new Date(r.sentAt).toISOString() : "",
        new Date(r.createdAt).toISOString(),
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
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => exportCsvHandler(ctx, args),
});
