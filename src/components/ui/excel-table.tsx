"use client";

import { useMemo } from "react";
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

interface ExcelTableProps {
  data: string[][];
  merges: { startRow: number; startCol: number; endRow: number; endCol: number }[];
  globalFilter: string;
  pageSize?: number;
}

function getCellSpan(
  merges: ExcelTableProps["merges"],
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

  const columns = useMemo<ColumnDef<string[], unknown>[]>(() => {
    const maxCols = Math.max(...data.map((r) => r.length), 0);
    return Array.from({ length: maxCols }, (_, colIdx) => ({
      id: String(colIdx),
      header: () => headerRow[colIdx] || `Col ${colIdx + 1}`,
      accessorFn: (row: string[]) => row[colIdx] ?? "",
      cell: ({ row }) => {
        const actualRowIdx = row.index + 1;
        const span = getCellSpan(merges, actualRowIdx, colIdx);
        if (span?.hidden) return null;
        return (
          <span className="text-foreground">
            {formatCell(row.original[colIdx] ?? "")}
          </span>
        );
      },
      meta: {
        rowSpan: (rowIndex: number) => {
          const actualRowIdx = rowIndex + 1;
          const span = getCellSpan(merges, actualRowIdx, colIdx);
          return span?.hidden ? 0 : (span?.rowSpan ?? 1);
        },
        colSpan: (rowIndex: number) => {
          const actualRowIdx = rowIndex + 1;
          const span = getCellSpan(merges, actualRowIdx, colIdx);
          return span?.hidden ? 0 : (span?.colSpan ?? 1);
        },
      },
    }));
  }, [headerRow, merges, data]);

  const tableData = useMemo(() => dataRows, [dataRows]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      if (!search) return true;
      return row.original.some((cell) =>
        String(cell).toLowerCase().includes(search)
      );
    },
    filterFns: {},
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
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={Number(row.id) % 2 === 0 ? "bg-white" : "bg-gray-50/80"}
              >
                <TableCell className="sticky left-0 z-10 bg-gray-100 border border-r border-b border-border text-center text-xs text-muted font-medium">
                  {row.index + 2}
                </TableCell>
                {row.getVisibleCells().map((cell) => {
                  const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
                  if (cellContent === null || cellContent === "") {
                    return <TableCell key={cell.id} className="border border-r border-b border-border px-3 py-1.5" />;
                  }
                  return (
                    <TableCell
                      key={cell.id}
                      className="border border-r border-b border-border px-3 py-1.5 whitespace-nowrap hover:bg-primary/5 transition-colors"
                    >
                      {cellContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted shrink-0">
        <span>
          {table.getFilteredRowModel().rows.length === dataRows.length
            ? `${dataRows.length.toLocaleString()} rows`
            : `${table.getFilteredRowModel().rows.length.toLocaleString()} of ${dataRows.length.toLocaleString()} rows`}
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
