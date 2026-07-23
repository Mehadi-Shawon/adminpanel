import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/types"

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa]",
  },
  processing: {
    label: "Processing",
    className: "bg-[#eb6834]/10 text-[#eb6834] dark:bg-[#d95926]/15 dark:text-[#d95926]",
  },
  "on-hold": {
    label: "On Hold",
    className: "bg-[#4f46e5]/10 text-[#4f46e5] dark:bg-[#818cf8]/15 dark:text-[#818cf8]",
  },
  completed: {
    label: "Completed",
    className: "bg-[#008300]/10 text-[#008300] dark:bg-[#008300]/15 dark:text-[#008300]",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[#e34948]/10 text-[#e34948] dark:bg-[#e66767]/15 dark:text-[#e66767]",
  },
  refunded: {
    label: "Refunded",
    className: "bg-[#2a78d6]/10 text-[#2a78d6] dark:bg-[#3987e5]/15 dark:text-[#3987e5]",
  },
  failed: {
    label: "Failed",
    className: "bg-[#ca8a04]/10 text-[#ca8a04] dark:bg-[#eab308]/15 dark:text-[#eab308]",
  },
}

// WooCommerce's real order statuses, in workflow order, for status pickers.
export const ORDER_STATUSES = Object.keys(STATUS_META) as OrderStatus[]

export const ORDER_STATUS_LABELS = Object.fromEntries(
  (Object.keys(STATUS_META) as OrderStatus[]).map((s) => [s, STATUS_META[s].label])
) as Record<OrderStatus, string>

// Solid accent color per status (matches the badge palette) for dots/indicators.
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "#7c3aed",
  processing: "#eb6834",
  "on-hold": "#4f46e5",
  completed: "#008300",
  cancelled: "#e34948",
  refunded: "#2a78d6",
  failed: "#eab308",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant="outline" className={`border-transparent ${meta.className}`}>
      {meta.label}
    </Badge>
  )
}
