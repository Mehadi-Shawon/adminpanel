import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Order } from "@/types"

const ADVANCE_RATE = 0.1

interface OrderDetailsDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {order && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>Order {order.orderNumber}</DialogTitle>
                <OrderStatusBadge status={order.status} />
              </div>
              <DialogDescription>Placed {formatDate(order.createdAt, "MMM d, yyyy 'at' h:mm a")}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{order.customerName}</span>
                <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
              </div>
              <div className="ml-auto text-right text-xs text-muted-foreground">
                <p>{order.shippingAddress.line1}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Items</p>
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2.5">
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="size-9 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
                  />
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm">{item.productName}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-mono text-sm tabular-nums">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">Invoice</p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span className="font-mono tabular-nums">
                  {order.shipping === 0 ? "Free" : formatCurrency(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatCurrency(order.total)}</span>
              </div>

              <Separator className="my-1" />

              {(() => {
                const advance = Math.round(order.total * ADVANCE_RATE)
                const due = order.total - advance
                return (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Advance paid (10%)</span>
                      <span className="font-mono tabular-nums">{formatCurrency(advance)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Due on delivery</span>
                      <span className="font-mono tabular-nums">{formatCurrency(due)}</span>
                    </div>
                  </>
                )
              })()}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
