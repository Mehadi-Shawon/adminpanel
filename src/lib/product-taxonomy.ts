import type { ProductStatus } from "@/types"

// WordPress/WooCommerce's real product post statuses.
export const PRODUCT_STATUSES = ["draft", "pending", "private", "publish"] as const

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  pending: "Pending Review",
  private: "Private",
  publish: "Published",
}
