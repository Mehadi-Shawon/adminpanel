import { Badge } from "@/components/ui/badge"
import type { ProductStatus } from "@/types"

const STATUS_META: Record<ProductStatus, { label: string; className: string }> = {
  publish: {
    label: "Published",
    className: "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  draft: {
    label: "Draft",
    className: "bg-secondary text-secondary-foreground",
  },
  pending: {
    label: "Pending Review",
    className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-500",
  },
  private: {
    label: "Private",
    className: "bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  },
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant="outline" className={`border-transparent ${meta.className}`}>
      {meta.label}
    </Badge>
  )
}
