import { useMemo, useState } from "react"
import { Search, Warehouse } from "lucide-react"
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
import { useProducts } from "@/hooks/use-products"
import { BACKORDER_LABEL, LOW_STOCK_THRESHOLD } from "@/pages/products/components/stock-indicator"
import type { Product } from "@/types"
import { inventoryColumns } from "./components/inventory-columns"

type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock" | "on-backorder"

// Buyability comes from WooCommerce's stock_status, not the quantity — most of
// the catalog has manage_stock off, so stock is 0 for products that sell fine.
// "Low stock" is the one filter that genuinely needs a number, so it only ever
// matches products that actually track one.
function matchesStockFilter(product: Product, filter: StockFilter) {
  if (filter === "all") return true
  if (filter === "out-of-stock") return product.stockStatus === "outofstock"
  if (filter === "on-backorder") return product.stockStatus === "onbackorder"
  if (filter === "low-stock") {
    return (
      product.stockStatus === "instock" &&
      product.manageStock &&
      product.stock <= LOW_STOCK_THRESHOLD
    )
  }
  return product.stockStatus === "instock"
}

export function InventoryPage() {
  const [search, setSearch] = useState("")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")

  const products = useProducts({ search: search || undefined })

  const filtered = useMemo(
    () => (products.data ?? []).filter((p) => matchesStockFilter(p, stockFilter)),
    [products.data, stockFilter]
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">Track and adjust stock levels across your catalog.</p>
      </div>

      {products.isPending ? (
        <DataTableSkeleton columns={5} />
      ) : (
        <DataTable
          columns={inventoryColumns}
          data={filtered}
          emptyMessage="No products match your filters."
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as StockFilter)}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stock</SelectItem>
                  <SelectItem value="in-stock">In stock</SelectItem>
                  <SelectItem value="low-stock">Low stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of stock</SelectItem>
                  <SelectItem value="on-backorder">{BACKORDER_LABEL}</SelectItem>
                </SelectContent>
              </Select>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground sm:ml-auto">
                <Warehouse className="size-4" />
                {filtered.length} product{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
          }
        />
      )}
    </div>
  )
}
