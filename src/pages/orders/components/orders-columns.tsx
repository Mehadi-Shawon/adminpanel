import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { useUpdateOrderStatus } from "@/hooks/use-orders"
import { formatCurrency, formatDate } from "@/lib/format"
import { generateInvoicePdf } from "@/lib/generate-invoice-pdf"
import type { Order, OrderStatus } from "@/types"

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; status: OrderStatus; className: string }>> = {
  pending: {
    label: "Mark as processing",
    status: "processing",
    className:
      "border-[#eb6834]/30 bg-[#eb6834]/10 text-[#eb6834] hover:bg-[#eb6834]/20 dark:border-[#d95926]/30 dark:bg-[#d95926]/15 dark:text-[#d95926] dark:hover:bg-[#d95926]/25",
  },
  "on-hold": {
    label: "Mark as processing",
    status: "processing",
    className:
      "border-[#eb6834]/30 bg-[#eb6834]/10 text-[#eb6834] hover:bg-[#eb6834]/20 dark:border-[#d95926]/30 dark:bg-[#d95926]/15 dark:text-[#d95926] dark:hover:bg-[#d95926]/25",
  },
  processing: {
    label: "Mark as completed",
    status: "completed",
    className:
      "border-[#008300]/30 bg-[#008300]/10 text-[#008300] hover:bg-[#008300]/20 dark:border-[#008300]/30 dark:bg-[#008300]/15 dark:text-[#008300] dark:hover:bg-[#008300]/25",
  },
}

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
  const next = NEXT_STATUS[order.status]

  function handleStatusChange(status: OrderStatus) {
    updateStatus.mutate(
      { id: order.id, status },
      {
        onSuccess: () =>
          toast.success(`Order ${order.orderNumber} updated`, { description: `Status set to ${status}.` }),
        onError: () => toast.error("Failed to update order status. Please try again."),
      }
    )
  }

  if (!next) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={updateStatus.isPending}
      className={next.className}
      onClick={(e) => {
        e.stopPropagation()
        handleStatusChange(next.status)
      }}
    >
      {next.label}
    </Button>
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
    header: "Status Action",
    cell: ({ row }) => <StatusActionCell order={row.original} />,
  },
  ]
}
