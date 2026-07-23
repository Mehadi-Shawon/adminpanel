import type { ColumnDef } from "@tanstack/react-table"
import { CustomerStatusBadge } from "@/components/customer-status-badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Customer } from "@/types"

export const customersColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{customer.name}</span>
          <span className="text-xs text-muted-foreground">{customer.email}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.phone}</span>,
  },
  {
    id: "location",
    header: "Location",
    accessorFn: (customer) => `${customer.city}, ${customer.country}`,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.city}, {row.original.country}
      </span>
    ),
  },
  {
    accessorKey: "totalOrders",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.totalOrders}</span>,
  },
  {
    accessorKey: "totalSpent",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Spent" />,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.totalSpent)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <CustomerStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
]
