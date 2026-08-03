"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, Download, Loader2, Search, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExcelTable } from "./excel-table";

interface SheetData {
  name: string;
  data: string[][];
  merges: { startRow: number; startCol: number; endRow: number; endCol: number }[];
}

interface ExcelPreviewProps {
  url: string;
  fileName?: string;
}

export function ExcelPreview({ url, fileName }: ExcelPreviewProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [search, setSearch] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const loadFile = useCallback(async () => {
    if (!url) return;
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

        const data = jsonData.map((row: any) =>
          Array.isArray(row) ? row.map(String) : [String(row)]
        );

        const merges = ((worksheet["!merges"] as any[]) ?? []).map((m) => ({
          startRow: m.s.r,
          startCol: m.s.c,
          endRow: m.e.r,
          endCol: m.e.c,
        }));

        allSheets.push({ name: sheetName, data, merges });
      }

      setSheets(allSheets);
      setActiveSheet(0);
      setSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (open) loadFile();
  }, [open, loadFile]);

  const currentSheet = sheets[activeSheet];
  const dataRows = currentSheet ? currentSheet.data.length - 1 : 0;
  const maxCols = currentSheet
    ? Math.max(...currentSheet.data.map((r) => r.length), 0)
    : 0;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        Preview
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
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
                    ? `${currentSheet.name} — ${dataRows.toLocaleString()} rows, ${maxCols} columns`
                    : "Loading..."}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {currentSheet && dataRows > 0 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <Input
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
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
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-sm text-muted">Loading preview...</span>
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

            {!loading && !error && currentSheet && dataRows === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-muted">No data in this sheet.</p>
              </div>
            )}

            {!loading && !error && currentSheet && dataRows > 0 && (
              <ExcelTable
                data={currentSheet.data}
                merges={currentSheet.merges}
                globalFilter={search}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
