/**
 * CSV export utilities. Generates RFC 4180-compliant CSV strings
 * and triggers a browser download.
 */

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (rows.length === 0 && !columns) return "";

  // Auto-derive columns from first row if not specified
  const cols =
    columns ??
    (Object.keys(rows[0]) as (keyof T)[]).map((key) => ({ key, header: String(key) }));

  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const s = String(value);
    // RFC 4180: escape quotes, wrap in quotes if contains comma/quote/newline
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = cols.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((row) => cols.map((c) => escape(row[c.key])).join(","))
    .join("\r\n");

  return header + "\r\n" + body;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
