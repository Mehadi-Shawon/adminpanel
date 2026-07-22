import { useEffect, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Check, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { StockIndicator } from "@/pages/products/components/stock-indicator"
import { useUpdateProduct } from "@/hooks/use-products"
import type { Product } from "@/types"

function AdjustStockCell({ product }: { product: Product }) {
  const updateProduct = useUpdateProduct()
  const [value, setValue] = useState(product.stock)

  useEffect(() => {
    setValue(product.stock)
  }, [product.stock])

  function save(newValue: number) {
    if (newValue === product.stock || newValue < 0) return
    updateProduct.mutate(
      {
        id: product.id,
        input: {
          name: product.name,
          sku: product.sku,
          description: product.description,
          categories: product.categories,
          type: product.type,
          regularPrice: product.regularPrice,
          salePrice: product.salePrice,
          stock: newValue,
          attributes: product.attributes.map((a) => ({ name: a.name, options: a.options })),
          status: product.status,
          images: product.images,
        },
      },
      {
        onSuccess: () =>
          toast.success("Stock updated", { description: `${product.name} now has ${newValue} in stock.` }),
        onError: () => {
          toast.error("Failed to update stock. Please try again.")
          setValue(product.stock)
        },
      }
    )
  }

  const dirty = value !== product.stock

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={updateProduct.isPending || value <= 0}
        onClick={() => setValue((v) => Math.max(0, v - 1))}
      >
        <Minus className="size-3.5" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
        className="h-8 w-16 text-center"
        disabled={updateProduct.isPending}
      />
      <Button
        variant="outline"
        size="icon-sm"
        disabled={updateProduct.isPending}
        onClick={() => setValue((v) => v + 1)}
      >
        <Plus className="size-3.5" />
      </Button>
      {dirty && (
        <Button size="icon-sm" disabled={updateProduct.isPending} onClick={() => save(value)}>
          <Check className="size-3.5" />
          <span className="sr-only">Save</span>
        </Button>
      )}
    </div>
  )
}

export const inventoryColumns: ColumnDef<Product>[] = [
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
    accessorKey: "stock",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
    cell: ({ row }) => <StockIndicator stock={row.original.stock} />,
  },
  {
    id: "adjust",
    header: "Adjust stock",
    cell: ({ row }) => <AdjustStockCell product={row.original} />,
  },
]
