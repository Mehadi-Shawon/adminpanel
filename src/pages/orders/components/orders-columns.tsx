import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  OrderStatusBadge,
} from "@/components/order-status-badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { useUpdateOrderStatus } from "@/hooks/use-orders"
import { formatCurrency, formatDate } from "@/lib/format"
import { generateInvoicePdf } from "@/lib/generate-invoice-pdf"
import type { Order, OrderStatus } from "@/types"

function DetailsCell({ order, onView }: { order: Order; onView: (order: Order) => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={(e) => {
        e.stopPropagation()
        onView(order)
      }}
    >
      <Eye className="size-4" />
      <span className="sr-only">View details</span>
    </Button>
  )
}

function InvoiceCell({ order }: { order: Order }) {
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setIsGenerating(true)
    try {
      await generateInvoicePdf(order)
    } catch {
      toast.error("Failed to generate invoice. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={isGenerating} onClick={handleClick}>
      {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
      Invoice
    </Button>
  )
}

function StatusActionCell({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus()

  function handleStatusChange(value: string) {
    const status = value as OrderStatus
    if (status === order.status) return
    updateStatus.mutate(
      { id: order.id, status },
      {
        onSuccess: () =>
          toast.success(`Order ${order.orderNumber} updated`, {
            description: `Status set to ${ORDER_STATUS_LABELS[status]}.`,
          }),
        onError: () => toast.error("Failed to update order status. Please try again."),
      }
    )
  }

  return (
    <Select value={order.status} onValueChange={handleStatusChange} disabled={updateStatus.isPending}>
      <SelectTrigger
        size="sm"
        className="w-[150px]"
        aria-label="Change order status"
        onClick={(e) => e.stopPropagation()}
      >
        {updateStatus.isPending ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Updating…
          </span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <span className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: ORDER_STATUS_COLOR[s] }}
              />
              {ORDER_STATUS_LABELS[s]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function getOrdersColumns(onView: (order: Order) => void): ColumnDef<Order>[] {
  return [
  {
    accessorKey: "orderNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
    cell: ({ row }) => <span className="font-medium">{row.original.orderNumber}</span>,
  },
  {
    id: "customer",
    header: "Customer",
    accessorFn: (order) => order.customerName,
    cell: ({ row }) => {
      const order = row.original
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{order.customerName}</span>
          <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    id: "items",
    header: "Items",
    accessorFn: (order) => order.items.reduce((sum, item) => sum + item.quantity, 0),
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.items.reduce((sum, item) => sum + item.quantity, 0)}
      </span>
    ),
  },
  {
    accessorKey: "total",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.total)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) => <DetailsCell order={row.original} onView={onView} />,
  },
  {
    id: "invoice",
    header: "Invoice",
    cell: ({ row }) => <InvoiceCell order={row.original} />,
  },
  {
    id: "status-action",
    header: "Change Status",
    cell: ({ row }) => <StatusActionCell order={row.original} />,
  },
  ]
}
