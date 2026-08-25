"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Download, Loader2, Search, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SheetData {
  name: string;
  data: string[][];
  merges: { startRow: number; startCol: number; endRow: number; endCol: number }[];
  colWidths: number[];
}

interface ExcelPreviewDialogProps {
  url: string;
  fileName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadingUrl?: boolean;
}

const ROWS_PER_PAGE = 100;
const MIN_COL_WIDTH = 80;
const MAX_COL_WIDTH = 300;

/** Shape of an `!merges` entry produced by SheetJS worksheets. */
interface SheetMerge {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

function parseMerges(merges: SheetMerge[] | undefined): SheetData["merges"] {
  return (merges ?? []).map((m) => ({
    startRow: m.s.r,
    startCol: m.s.c,
    endRow: m.e.r,
    endCol: m.e.c,
  }));
}

function getCellSpan(
  merges: SheetData["merges"],
  rowIdx: number,
  colIdx: number
): { rowSpan: number; colSpan: number; hidden: boolean } | null {
  for (const merge of merges) {
    if (rowIdx === merge.startRow && colIdx === merge.startCol) {
      return {
        rowSpan: merge.endRow - merge.startRow + 1,
        colSpan: merge.endCol - merge.startCol + 1,
        hidden: false,
      };
    }
    if (
      rowIdx >= merge.startRow &&
      rowIdx <= merge.endRow &&
      colIdx >= merge.startCol &&
      colIdx <= merge.endCol
    ) {
      return { rowSpan: 1, colSpan: 1, hidden: true };
    }
  }
  return null;
}

function formatCell(value: string): string {
  if (!value || value === "undefined" || value === "null") return "";
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== "" && !value.startsWith("0") && !value.includes(".")) {
    return num.toLocaleString();
  }
  if (!isNaN(num) && value.includes(".") && value.trim() !== "") {
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return value;
}

export function ExcelPreviewDialog({
  url,
  fileName,
  open,
  onOpenChange,
  loadingUrl = false,
}: ExcelPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const loadFile = useCallback(async () => {
    if (!url || loadingUrl) return;
    setLoading(true);
    setError(null);
    setSheets([]);

    try {
      const XLSX = await import("xlsx");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch file");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const allSheets: SheetData[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1,
          defval: "",
          blankrows: true,
        });

        const data = jsonData.map((row: unknown) =>
          Array.isArray(row) ? row.map(String) : [String(row)]
        );

        const maxCols = Math.max(...data.map((r: string[]) => r.length), 0);
        const colWidths: number[] = Array.from({ length: maxCols }, (_, i) => {
          let maxLen = 10;
          for (const row of data) {
            const cellLen = String(row[i] ?? "").length;
            if (cellLen > maxLen) maxLen = cellLen;
          }
          return Math.min(Math.max(maxLen * 8 + 16, MIN_COL_WIDTH), MAX_COL_WIDTH);
        });

        allSheets.push({
          name: sheetName,
          data,
          merges: parseMerges(worksheet["!merges"] as SheetMerge[] | undefined),
          colWidths,
        });
      }

      setSheets(allSheets);
      setActiveSheet(0);
      setPage(1);
      setSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }, [url, loadingUrl]);

  useEffect(() => {
    // Load asynchronously when the dialog opens; state updates happen inside
    // the async callback, not synchronously in the effect body.
    if (!open) return;
    const t = window.setTimeout(() => {
      void loadFile();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, loadFile]);

  const currentSheet = sheets[activeSheet];

  const filteredData = useMemo(() => {
    if (!currentSheet) return [];
    const data = currentSheet.data;
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(q))
    );
  }, [currentSheet, search]);

  const maxCols = currentSheet
    ? Math.max(...currentSheet.data.map((row) => row.length), 0)
    : 0;

  const headerRow = filteredData[0] ?? [];
  const dataRows = filteredData.slice(1);
  const totalPages = Math.ceil(dataRows.length / ROWS_PER_PAGE);
  const visibleRows = dataRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const totalColWidth = currentSheet
    ? currentSheet.colWidths.reduce((a, b) => a + b, 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          fullscreen
            ? "w-screen h-screen max-w-none max-h-none m-0 rounded-none"
            : "max-w-[92vw] w-full max-h-[92vh]"
        } flex flex-col p-0`}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{fileName ?? "Excel Preview"}</DialogTitle>
              <DialogDescription>
                {currentSheet
                  ? `${currentSheet.name} — ${dataRows.length} rows, ${maxCols} columns`
                  : "Loading..."}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {currentSheet && dataRows.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="h-8 w-48 pl-8 text-sm"
                  />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setFullscreen(!fullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <a href={url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
              </a>
            </div>
          </div>

          {sheets.length > 1 && (
            <div className="flex gap-1 overflow-x-auto pt-2 -mb-1">
              {sheets.map((sheet, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSheet(i);
                    setPage(1);
                    setSearch("");
                  }}
                  className={`shrink-0 rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeSheet === i
                      ? "bg-primary text-white"
                      : "bg-surface text-muted hover:bg-surface/80"
                  }`}
                >
                  {sheet.name}
                </button>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {(loading || loadingUrl) && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted">
                {loadingUrl ? "Signing preview..." : "Loading preview..."}
              </span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={loadFile}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && currentSheet && dataRows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-muted">
                {search ? "No matching rows found." : "No data in this sheet."}
              </p>
            </div>
          )}

          {!loading && !error && currentSheet && dataRows.length > 0 && (
            <div className="h-full overflow-auto">
              <table
                className="border-collapse text-sm"
                style={{ minWidth: totalColWidth }}
              >
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th className="sticky left-0 z-30 border border-r border-b border-primary/20 bg-primary px-3 py-2 text-center text-xs font-semibold text-white w-12">
                      #
                    </th>
                    {headerRow.map((cell, colIdx) => (
                      <th
                        key={colIdx}
                        className="border border-r border-b border-primary/20 bg-primary px-3 py-2 text-left text-xs font-semibold text-white whitespace-nowrap"
                        style={{ minWidth: currentSheet.colWidths[colIdx] ?? MIN_COL_WIDTH }}
                      >
                        {cell || `Col ${colIdx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, visibleIdx) => {
                    const rowIdx = visibleIdx + 1;
                    const globalRowIdx = (page - 1) * ROWS_PER_PAGE + visibleIdx + 1;
                    return (
                      <tr
                        key={visibleIdx}
                        className={visibleIdx % 2 === 0 ? "bg-white" : "bg-gray-50/80"}
                      >
                        <td className="sticky left-0 z-10 border border-r border-b border-border bg-gray-100 px-2 py-1.5 text-center text-xs text-muted font-medium">
                          {globalRowIdx}
                        </td>
                        {Array.from({ length: maxCols }, (_, colIdx) => {
                          const span = getCellSpan(currentSheet.merges, rowIdx, colIdx);
                          if (span?.hidden) return null;
                          return (
                            <td
                              key={colIdx}
                              className="border border-r border-b border-border px-3 py-1.5 text-sm text-foreground whitespace-nowrap hover:bg-primary/5 transition-colors"
                              rowSpan={span?.rowSpan}
                              colSpan={span?.colSpan}
                            >
                              {formatCell(row[colIdx] ?? "")}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && !error && currentSheet && dataRows.length > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-3 text-xs text-muted shrink-0">
            <span>
              Showing {(page - 1) * ROWS_PER_PAGE + 1}–
              {Math.min(page * ROWS_PER_PAGE, dataRows.length)} of{" "}
              {dataRows.length.toLocaleString()} rows
              {search && ` (filtered from ${currentSheet.data.length - 1})`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ‹
              </Button>
              <span className="px-2 text-xs font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              >
                »
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
