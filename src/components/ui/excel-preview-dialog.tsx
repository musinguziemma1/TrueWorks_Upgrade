"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SheetData {
  name: string;
  data: string[][];
  merges: string[];
}

interface ExcelPreviewDialogProps {
  url: string;
  fileName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExcelPreviewDialog({ url, fileName, open, onOpenChange }: ExcelPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);

  const loadFile = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setSheets([]);

    try {
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

        const data = jsonData.map((row) =>
          Array.isArray(row) ? row.map(String) : [String(row)]
        );

        const merges = (worksheet["!merges"] ?? []).map((m) => {
          const start = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
          const end = XLSX.utils.encode_cell({ r: m.e.r, c: m.e.c });
          return `${start}:${end}`;
        });

        allSheets.push({ name: sheetName, data, merges });
      }

      setSheets(allSheets);
      setActiveSheet(0);
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
  const maxCols = currentSheet
    ? Math.max(...currentSheet.data.map((row) => row.length), 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{fileName ?? "Excel Preview"}</DialogTitle>
              <DialogDescription>
                {currentSheet && (
                  <>
                    Sheet: {currentSheet.name} - {currentSheet.data.length} rows
                  </>
                )}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {sheets.length > 1 && (
                <Select
                  value={String(activeSheet)}
                  onValueChange={(v) => setActiveSheet(Number(v))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map((sheet, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {sheet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <a href={url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
              </a>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-sm text-muted-foreground">Loading preview...</span>
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

          {!loading && !error && currentSheet && (
            <div className="overflow-auto rounded-lg border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  {currentSheet.data.length > 0 && (
                    <tr className="bg-[#0B2545]">
                      {Array.from({ length: maxCols }, (_, colIdx) => (
                        <th
                          key={colIdx}
                          className="border border-[#0B2545]/80 px-3 py-2 text-left text-xs font-semibold text-white whitespace-nowrap"
                        >
                          {currentSheet.data[0]?.[colIdx] ?? ""}
                        </th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {currentSheet.data.slice(1).map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {Array.from({ length: maxCols }, (_, colIdx) => (
                        <td
                          key={colIdx}
                          className="border border-gray-200 px-3 py-1.5 text-sm text-foreground whitespace-nowrap"
                        >
                          {row[colIdx] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && sheets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-muted-foreground">No data found in this file.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
