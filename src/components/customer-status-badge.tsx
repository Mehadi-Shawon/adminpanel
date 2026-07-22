import { Badge } from "@/components/ui/badge"
import type { CustomerStatus } from "@/types"

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="border-transparent bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      >
        Active
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Inactive
    </Badge>
  )
}
