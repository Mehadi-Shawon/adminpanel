import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, Loader2, Plus, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getProducts } from "@/lib/api/products"
import { useProductVariations } from "@/hooks/use-products"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Product } from "@/types"

export interface PickedItem {
  productId: number
  variationId?: number
  name: string
  variationLabel?: string
  price: number
  imageUrl: string
}

const effectivePrice = (regular: number, sale?: number) => sale ?? regular

interface ProductPickerProps {
  onAdd: (item: PickedItem) => void
}

export function ProductPicker({ onAdd }: ProductPickerProps) {
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 300)
    return () => window.clearTimeout(id)
  }, [query])

  const results = useQuery({
    queryKey: ["products", "search", debounced],
    queryFn: () => getProducts({ search: debounced }),
    enabled: debounced.length >= 2,
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products by name or SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {debounced.length < 2 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Type at least 2 characters to search your products.
        </p>
      ) : results.isPending ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Searching…
        </div>
      ) : (results.data ?? []).length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No products found.</p>
      ) : (
        <ul className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
          {(results.data ?? []).map((product) => (
            <li key={product.id}>
              <ProductRow product={product} onAdd={onAdd} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProductRow({ product, onAdd }: { product: Product; onAdd: (item: PickedItem) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isVariable = product.type === "variable"
  const price = effectivePrice(product.regularPrice, product.salePrice)

  return (
    <div className="rounded-lg">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50">
        {product.images[0]?.src ? (
          <img
            src={product.images[0].src}
            alt=""
            className="size-9 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
          />
        ) : (
          <div className="size-9 shrink-0 rounded-md bg-muted" />
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{product.name}</span>
          <span className="text-xs text-muted-foreground">
            {isVariable ? "Variable — choose a variation" : formatCurrency(price)}
          </span>
        </div>
        {isVariable ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto shrink-0"
            onClick={() => setExpanded((v) => !v)}
          >
            Variations
            <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto shrink-0"
            onClick={() =>
              onAdd({
                productId: Number(product.id),
                name: product.name,
                price,
                imageUrl: product.images[0]?.src ?? "",
              })
            }
          >
            <Plus className="size-4" />
            Add
          </Button>
        )}
      </div>

      {isVariable && expanded && (
        <VariationList product={product} onAdd={onAdd} />
      )}
    </div>
  )
}

function VariationList({ product, onAdd }: { product: Product; onAdd: (item: PickedItem) => void }) {
  const variations = useProductVariations(product.id, true)

  if (variations.isPending) {
    return (
      <div className="ml-11 flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Loading variations…
      </div>
    )
  }

  const list = variations.data ?? []
  if (list.length === 0) {
    return <p className="ml-11 py-2 text-xs text-muted-foreground">No variations found.</p>
  }

  return (
    <ul className="ml-11 flex flex-col border-l pl-3">
      {list.map((v) => {
        const label = v.attributes.map((a) => a.option).join(" / ")
        const price = effectivePrice(v.regularPrice ?? 0, v.salePrice)
        return (
          <li
            key={v.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
          >
            <span className="truncate text-sm">{label || `#${v.id}`}</span>
            <span className="text-xs text-muted-foreground">{formatCurrency(price)}</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() =>
                onAdd({
                  productId: Number(product.id),
                  variationId: v.id,
                  name: product.name,
                  variationLabel: label || undefined,
                  price,
                  imageUrl: v.image?.src || product.images[0]?.src || "",
                })
              }
            >
              <Plus className="size-4" />
              Add
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
