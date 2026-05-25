// table/SuppliersDataTable.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 8;

interface SuppliersDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function SuppliersDataTable<TData, TValue>({
  columns,
  data,
}: SuppliersDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = data.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);
  const pageCount = table.getPageCount();

  // Build visible page numbers with ellipsis
  const visiblePages = buildPageRange(pageIndex, pageCount);

  return (
    <div className="flex flex-col gap-3">
      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/40 hover:bg-muted/40"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className="h-9 px-3 text-[11px] font-medium tracking-wide uppercase text-muted-foreground select-none"
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-1 ${
                            canSort
                              ? "cursor-pointer hover:text-foreground transition-colors"
                              : ""
                          }`}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {canSort && (
                            <span className="shrink-0 opacity-50">
                              {sorted === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-11 hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-0 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-sm text-muted-foreground"
                >
                  Aucun résultat trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {start}–{end} sur {total}
          </span>

          <div className="flex items-center gap-1">
            <PagerButton
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </PagerButton>

            {visiblePages.map((p, i) =>
              p === "…" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-xs text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <PagerButton
                  key={p}
                  onClick={() => table.setPageIndex(p as number)}
                  active={(p as number) === pageIndex}
                >
                  {(p as number) + 1}
                </PagerButton>
              ),
            )}

            <PagerButton
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </PagerButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pager Button ────────────────────────────────────────────────────────────

interface PagerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

const PagerButton = ({
  active,
  children,
  className = "",
  ...props
}: PagerButtonProps) => (
  <button
    {...props}
    className={`
      inline-flex items-center justify-center h-7 min-w-7 px-1.5 rounded-md text-xs
      border transition-colors
      ${
        active
          ? "bg-foreground text-background border-transparent font-medium"
          : "bg-background border-border/60 text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
      }
      ${className}
    `}
  >
    {children}
  </button>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const result: (number | "…")[] = [];
  const add = (p: number) => {
    if (!result.includes(p)) result.push(p);
  };
  add(0);
  if (current > 2) result.push("…");
  for (
    let p = Math.max(1, current - 1);
    p <= Math.min(total - 2, current + 1);
    p++
  )
    add(p);
  if (current < total - 3) result.push("…");
  add(total - 1);
  return result;
}
