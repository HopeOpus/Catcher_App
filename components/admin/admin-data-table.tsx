"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminDataTableProps<TData extends { id: string }> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  renderMobileCard: (item: TData) => React.ReactNode;
  toolbar?: React.ReactNode;
  searchPlaceholder?: string;
  searchPredicate?: (item: TData, query: string) => boolean;
  entityLabel: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  selectedRowId?: string | null;
  onSelectRow?: (rowId: string) => void;
};

function defaultSearchPredicate<TData extends Record<string, unknown>>(
  item: TData,
  query: string,
) {
  return Object.values(item).some((value) => {
    if (typeof value !== "string" && typeof value !== "number") {
      return false;
    }

    return String(value).toLowerCase().includes(query);
  });
}

export function AdminDataTable<TData extends { id: string }>({
  columns,
  data,
  renderMobileCard,
  toolbar,
  searchPlaceholder = "Search records",
  searchPredicate = defaultSearchPredicate,
  entityLabel,
  emptyStateTitle,
  emptyStateDescription,
  initialPageSize = 8,
  pageSizeOptions = [5, 8, 12, 20],
  selectedRowId = null,
  onSelectRow,
}: AdminDataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [query, setQuery] = React.useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredData = React.useMemo(() => {
    if (!normalizedQuery) {
      return data;
    }

    return data.filter((item) => searchPredicate(item, normalizedQuery));
  }, [data, normalizedQuery, searchPredicate]);

  // TanStack Table manages internal table functions that React Compiler can't memoize safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    const pageCount = table.getPageCount();

    if (pageCount > 0 && pagination.pageIndex > pageCount - 1) {
      table.setPageIndex(pageCount - 1);
    }

    if (pageCount === 0 && pagination.pageIndex !== 0) {
      table.setPageIndex(0);
    }
  }, [pagination.pageIndex, table, filteredData.length]);

  const rows = table.getRowModel().rows;
  const totalRows = filteredData.length;
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const pageEnd =
    totalRows === 0 ? 0 : Math.min(totalRows, pageStart + rows.length - 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              table.setPageIndex(0);
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-600">
            {totalRows === 0
              ? `No ${entityLabel} found`
              : `Showing ${pageStart}-${pageEnd} of ${totalRows} ${entityLabel}`}
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Rows</span>
            <select
              value={pagination.pageSize}
              onChange={(event) => {
                table.setPageSize(Number(event.target.value));
                table.setPageIndex(0);
              }}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#36689e]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {toolbar ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {toolbar}
        </div>
      ) : null}

      {totalRows === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <p className="text-lg font-semibold text-[#0F2651]">{emptyStateTitle}</p>
            <p className="max-w-xl text-sm text-slate-600">{emptyStateDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
            <Table>
              <TableHeader className="bg-slate-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-2 font-semibold text-slate-700 transition-colors hover:text-[#0F2651]"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.original.id === selectedRowId ? "selected" : undefined}
                    className={cn(
                      onSelectRow ? "cursor-pointer" : undefined,
                      row.original.id === selectedRowId ? "bg-[#36689e]/5" : undefined,
                    )}
                    onClick={() => onSelectRow?.(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {rows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
                  row.original.id === selectedRowId ? "border-[#36689e]/40 bg-[#36689e]/5" : undefined,
                )}
              >
                {renderMobileCard(row.original)}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {Math.max(table.getPageCount(), 1)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
