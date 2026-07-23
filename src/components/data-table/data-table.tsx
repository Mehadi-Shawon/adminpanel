import {
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { cn } from "@/lib/utils"

// When provided, the table paginates and sorts server-side: `data` holds only
// the current page, and page/sort changes are pushed back to the parent (which
// refetches). Absent → the table paginates and sorts the full `data` in memory.
export interface ServerPagination {
  pageIndex: number
  pageSize: number
  pageCount: number
  onPageChange: (pageIndex: number) => void
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: React.ReactNode
  onRowClick?: (row: TData) => void
  emptyMessage?: string
  initialSorting?: SortingState
  server?: ServerPagination
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  onRowClick,
  emptyMessage = "No results.",
  initialSorting = [],
  server,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: server ? server.sorting : sorting,
      ...(server ? { pagination: { pageIndex: server.pageIndex, pageSize: server.pageSize } } : {}),
    },
    onSortingChange: server ? server.onSortingChange : setSorting,
    manualPagination: !!server,
    manualSorting: !!server,
    pageCount: server ? server.pageCount : undefined,
    onPaginationChange: server
      ? (updater) => {
          const next =
            typeof updater === "function"
              ? updater({ pageIndex: server.pageIndex, pageSize: server.pageSize })
              : updater
          server.onPageChange(next.pageIndex)
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: server ? undefined : getSortedRowModel(),
    getPaginationRowModel: server ? undefined : getPaginationRowModel(),
    ...(server ? {} : { initialState: { pagination: { pageSize: 20 } } }),
  })

  return (
    <div className="flex flex-col gap-4">
      {toolbar}
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
