import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/types"

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-[#2a78d6]/10 text-[#2a78d6] dark:bg-[#3987e5]/15 dark:text-[#3987e5]",
  },
  processing: {
    label: "Processing",
    className: "bg-[#eb6834]/10 text-[#eb6834] dark:bg-[#d95926]/15 dark:text-[#d95926]",
  },
  "on-hold": {
    label: "On Hold",
    className: "bg-[#eda100]/10 text-[#eda100] dark:bg-[#c98500]/15 dark:text-[#c98500]",
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
    className: "bg-[#4a3aa7]/10 text-[#4a3aa7] dark:bg-[#9085e9]/15 dark:text-[#9085e9]",
  },
  failed: {
    label: "Failed",
    className: "bg-[#1baf7a]/10 text-[#1baf7a] dark:bg-[#199e70]/15 dark:text-[#199e70]",
  },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant="outline" className={`border-transparent ${meta.className}`}>
      {meta.label}
    </Badge>
  )
}
