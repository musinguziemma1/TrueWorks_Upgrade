"use client";

import { useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface MergeInfo {
  rowSpan: number;
  colSpan: number;
  hidden: boolean;
}

interface ExcelTableProps {
  data: string[][];
  merges: { startRow: number; startCol: number; endRow: number; endCol: number }[];
  globalFilter: string;
  pageSize?: number;
}

function buildMergeMap(
  merges: ExcelTableProps["merges"]
): Map<string, MergeInfo> {
  const map = new Map<string, MergeInfo>();
  for (const m of merges) {
    for (let r = m.startRow; r <= m.endRow; r++) {
      for (let c = m.startCol; c <= m.endCol; c++) {
        const key = `${r}:${c}`;
        if (r === m.startRow && c === m.startCol) {
          map.set(key, {
            rowSpan: m.endRow - m.startRow + 1,
            colSpan: m.endCol - m.startCol + 1,
            hidden: false,
          });
        } else {
          map.set(key, { rowSpan: 1, colSpan: 1, hidden: true });
        }
      }
    }
  }
  return map;
}

function formatCell(value: string): string {
  if (!value || value === "undefined" || value === "null") return "";
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== "" && !value.startsWith("0") && !value.includes(".")) {
    return num.toLocaleString();
  }
  if (!isNaN(num) && value.includes(".") && value.trim() !== "") {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return value;
}

export function ExcelTable({ data, merges, globalFilter, pageSize = 100 }: ExcelTableProps) {
  const headerRow = data[0] ?? [];
  const dataRows = data.slice(1);
  const maxCols = Math.max(...data.map((r) => r.length), 0);

  const mergeMap = useMemo(() => buildMergeMap(merges), [merges]);

  const getMerge = useCallback(
    (rowIdx: number, colIdx: number): MergeInfo | undefined => {
      return mergeMap.get(`${rowIdx}:${colIdx}`);
    },
    [mergeMap]
  );

  const columns = useMemo<ColumnDef<string[], unknown>[]>(() => {
    return Array.from({ length: maxCols }, (_, colIdx) => ({
      id: String(colIdx),
      header: () => headerRow[colIdx] || `Col ${colIdx + 1}`,
      accessorFn: (row: string[]) => row[colIdx] ?? "",
    }));
  }, [headerRow, maxCols]);

  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return dataRows;
    const q = globalFilter.toLowerCase();
    return dataRows.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(q))
    );
  }, [dataRows, globalFilter]);

  const tableData = useMemo(() => filteredData, [filteredData]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <Table className="border-collapse text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-30 bg-primary text-white border border-r border-b border-primary/20 w-12 text-center text-xs font-semibold">
                  #
                </TableHead>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-primary text-white border border-r border-b border-primary/20 text-xs font-semibold whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const globalRowIdx = row.index + 1;
              return (
                <TableRow
                  key={row.id}
                  className={row.index % 2 === 0 ? "bg-white" : "bg-gray-50/80"}
                >
                  <TableCell className="sticky left-0 z-10 bg-gray-100 border border-r border-b border-border text-center text-xs text-muted font-medium">
                    {globalRowIdx + 1}
                  </TableCell>
                  {Array.from({ length: maxCols }, (_, colIdx) => {
                    const merge = getMerge(globalRowIdx, colIdx);
                    if (merge?.hidden) return null;

                    const value = row.original[colIdx] ?? "";
                    const formatted = formatCell(value);

                    return (
                      <TableCell
                        key={colIdx}
                        className="border border-r border-b border-border px-3 py-1.5 text-sm text-foreground whitespace-nowrap hover:bg-primary/5 transition-colors"
                        {...(merge && !merge.hidden && (merge.rowSpan > 1 || merge.colSpan > 1)
                          ? { rowSpan: merge.rowSpan, colSpan: merge.colSpan }
                          : {})}
                      >
                        {formatted}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted shrink-0">
        <span>
          {filteredData.length === dataRows.length
            ? `${dataRows.length.toLocaleString()} rows`
            : `${filteredData.length.toLocaleString()} of ${dataRows.length.toLocaleString()} rows`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7 rounded border bg-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
          >
            «
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7 rounded border bg-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
          >
            ‹
          </button>
          <span className="px-2 text-xs font-medium">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7 rounded border bg-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
          >
            ›
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7 rounded border bg-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
