import { action, internalQuery, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

const EXPORT_MAX_ROWS = 10_000;

interface ExportFilters {
  search?: string;
  activeOnly?: boolean;
  limit?: number;
}

interface ExportRow {
  email: string;
  name: string;
  source: string;
  active: boolean;
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
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? EXPORT_MAX_ROWS, EXPORT_MAX_ROWS);
    let all = await ctx.db.query("subscribers").collect();
    if (args.activeOnly) all = all.filter((s) => s.active);
    if (args.search) {
      const l = args.search.toLowerCase();
      all = all.filter(
        (s) =>
          s.email.toLowerCase().includes(l) ||
          (s.name ?? "").toLowerCase().includes(l) ||
          (s.source ?? "").toLowerCase().includes(l)
      );
    }
    all.sort((a, b) => b.createdAt - a.createdAt);
    return all.slice(0, limit).map((s) => ({
      email: s.email,
      name: s.name ?? "",
      source: s.source ?? "",
      active: s.active,
      createdAt: s.createdAt,
    }));
  },
});

async function exportCsvHandler(ctx: ActionCtx, args: ExportFilters): Promise<ExportResult> {
  const isAdmin = await ctx.runQuery(api.users.isAdmin, {});
  if (!isAdmin) throw new Error("Unauthorized: Admin access required");

  const limit = Math.min(args.limit ?? EXPORT_MAX_ROWS, EXPORT_MAX_ROWS);
  const rows: ExportRow[] = await ctx.runQuery(internal.subscriberExport.listForExport, {
    search: args.search,
    activeOnly: args.activeOnly,
    limit,
  });

  const truncated = rows.length >= limit;
  const header = ["email", "name", "source", "active", "subscribedAt"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [r.email, r.name, r.source, r.active ? "active" : "inactive", new Date(r.createdAt).toISOString()]
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
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => exportCsvHandler(ctx, args),
});
