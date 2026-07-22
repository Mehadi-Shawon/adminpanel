import type { ColumnDef } from "@tanstack/react-table"
import { Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductStatusBadge } from "@/components/product-status-badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { formatCurrency } from "@/lib/format"
import type { Product } from "@/types"
import { StockIndicator } from "./stock-indicator"

export function getProductsColumns(onEdit: (product: Product) => void): ColumnDef<Product>[] {
  return [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="flex items-center gap-2.5">
          <img
            src={product.images[0]?.src}
            alt={product.name}
            className="size-9 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{product.name}</span>
            <span className="text-xs text-muted-foreground">{product.sku}</span>
          </div>
        </div>
      )
    },
  },
  {
    id: "category",
    header: "Category",
    accessorFn: (product) => product.categories[0]?.name ?? "",
    cell: ({ row }) => <Badge variant="outline">{row.original.categories[0]?.name}</Badge>,
  },
  {
    accessorKey: "regularPrice",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      const { regularPrice, salePrice, type } = row.original
      if (type === "variable") {
        return <span className="text-sm text-muted-foreground">Variable</span>
      }
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums">
            {formatCurrency(salePrice ?? regularPrice)}
          </span>
          {salePrice !== undefined && (
            <span className="font-mono text-xs tabular-nums text-muted-foreground line-through">
              {formatCurrency(regularPrice)}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "stock",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
    cell: ({ row }) => <StockIndicator stock={row.original.stock} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: "Edit",
    cell: ({ row }) => (
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onEdit(row.original)
        }}
      >
        <Pencil className="size-4" />
        Edit
      </Button>
    ),
  },
  ]
}
