import type { ReactNode } from "react"
import type { Product } from "@/types"

/** At or below this many units, a stock-managed product counts as low. */
export const LOW_STOCK_THRESHOLD = 20

/**
 * How we label WooCommerce's `onbackorder` status. WooCommerce has no
 * "pre-order" concept — onbackorder is its only word for "sellable but not in
 * hand" — so this is purely display wording, and "Pre-order" is what it means
 * here: these products don't manage stock at all, they're sourced once ordered.
 * Change it here and every filter and table cell follows.
 */
export const BACKORDER_LABEL = "Pre-order"

function Dot({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span className={`size-2 shrink-0 rounded-full ${className}`} />
      {children}
    </span>
  )
}

// WooCommerce's stock_status is the authority on whether a product is buyable.
// stock_quantity is only a real number when manage_stock is on — otherwise it
// comes back null, so showing a count (or treating null as 0) would claim
// "Out of stock" for products the store sells perfectly happily.
export function StockIndicator({ product }: { product: Product }) {
  const { stockStatus, manageStock, stock } = product

  if (stockStatus === "outofstock") {
    return <Dot className="bg-destructive">
      <span className="text-destructive">Out of stock</span>
    </Dot>
  }

  if (stockStatus === "onbackorder") {
    return <Dot className="bg-sky-500">
      <span className="text-sky-700 dark:text-sky-400">{BACKORDER_LABEL}</span>
    </Dot>
  }

  // In stock, but no quantity is tracked — "In stock" is all WooCommerce knows.
  if (!manageStock) {
    return <Dot className="bg-emerald-500">
      <span className="text-muted-foreground">In stock</span>
    </Dot>
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return <Dot className="bg-amber-500">
      <span className="text-amber-600 dark:text-amber-500">{stock} in stock</span>
    </Dot>
  }

  return <Dot className="bg-emerald-500">
    <span className="text-muted-foreground">{stock} in stock</span>
  </Dot>
}
