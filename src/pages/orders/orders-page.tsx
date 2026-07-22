import { useState } from "react"
import { Search, ShoppingCart } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { useOrders } from "@/hooks/use-orders"
import type { Order, OrderStatus } from "@/types"
import { getOrdersColumns } from "./components/orders-columns"
import { OrderDetailsDialog } from "./components/order-details-dialog"

export function OrdersPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<OrderStatus | "all">("all")
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const orders = useOrders({
    search: search || undefined,
    status: status === "all" ? undefined : status,
  })

  function handleView(order: Order) {
    setViewingOrder(order)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">Every order placed in your store.</p>
      </div>

      {orders.isPending ? (
        <DataTableSkeleton columns={7} />
      ) : (
        <DataTable
          columns={getOrdersColumns(handleView)}
          data={orders.data ?? []}
          initialSorting={[{ id: "createdAt", desc: true }]}
          onRowClick={handleView}
          emptyMessage="No orders match your filters."
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by order # or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus | "all")}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              {orders.data && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground sm:ml-auto">
                  <ShoppingCart className="size-4" />
                  {orders.data.length} order{orders.data.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          }
        />
      )}

      <OrderDetailsDialog order={viewingOrder} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
