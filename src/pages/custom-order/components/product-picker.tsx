import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronDown, Loader2, Plus, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getProducts, type ProductVariation } from "@/lib/api/products"
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

// How long the green "Added" confirmation stays on the button/row.
const FLASH_MS = 1400

// The added-items list sits below the picker and is easy to miss, so every Add
// confirms itself in place: the button turns green and the row flashes.
function useAddedFlash(ms = FLASH_MS) {
  const [flashing, setFlashing] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function flash() {
    // Re-adding the same row restarts the timer instead of cutting it short.
    window.clearTimeout(timer.current)
    setFlashing(true)
    timer.current = window.setTimeout(() => setFlashing(false), ms)
  }

  return [flashing, flash] as const
}

// Fixed width so swapping "Add" for "Added" doesn't shift the row.
function AddButton({ added, onClick }: { added: boolean; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "w-[5.25rem] shrink-0 justify-center transition-all duration-200",
        added &&
          "scale-[1.04] border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:bg-emerald-500"
      )}
    >
      {added ? (
        <>
          <Check className="size-4 animate-in zoom-in-50 duration-200" />
          Added
        </>
      ) : (
        <>
          <Plus className="size-4" />
          Add
        </>
      )}
    </Button>
  )
}

// Persistent "it's in the order" marker — survives the flash, so the admin can
// tell at a glance what's already been added without leaving the search.
function InOrderBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <Badge
      variant="secondary"
      className="shrink-0 animate-in zoom-in-75 tabular-nums duration-200"
    >
      {count} in order
    </Badge>
  )
}

interface ProductPickerProps {
  onAdd: (item: PickedItem) => void
  // Quantity already in the draft order. Omit `variationId` to get the total
  // across every variation of a variable product.
  getQuantity: (productId: number, variationId?: number) => number
}

export function ProductPicker({ onAdd, getQuantity }: ProductPickerProps) {
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
              <ProductRow product={product} onAdd={onAdd} getQuantity={getQuantity} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProductRow({
  product,
  onAdd,
  getQuantity,
}: {
  product: Product
  onAdd: (item: PickedItem) => void
  getQuantity: (productId: number, variationId?: number) => number
}) {
  const [expanded, setExpanded] = useState(false)
  const [flashing, flash] = useAddedFlash()
  const isVariable = product.type === "variable"
  const price = effectivePrice(product.regularPrice, product.salePrice)
  const productId = Number(product.id)
  // For a variable product this is the total across all its variations.
  const inOrder = getQuantity(productId)

  return (
    <div className="rounded-lg">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-300 hover:bg-muted/50",
          flashing && "bg-emerald-500/10 ring-1 ring-emerald-500/40 hover:bg-emerald-500/10"
        )}
      >
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
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <InOrderBadge count={inOrder} />
          {isVariable ? (
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              Variations
              <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
            </Button>
          ) : (
            <AddButton
              added={flashing}
              onClick={() => {
                onAdd({
                  productId,
                  name: product.name,
                  price,
                  imageUrl: product.images[0]?.src ?? "",
                })
                flash()
              }}
            />
          )}
        </div>
      </div>

      {isVariable && expanded && (
        <VariationList product={product} onAdd={onAdd} getQuantity={getQuantity} />
      )}
    </div>
  )
}

function VariationList({
  product,
  onAdd,
  getQuantity,
}: {
  product: Product
  onAdd: (item: PickedItem) => void
  getQuantity: (productId: number, variationId?: number) => number
}) {
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
      {list.map((v) => (
        <VariationRow
          key={v.id}
          product={product}
          variation={v}
          onAdd={onAdd}
          getQuantity={getQuantity}
        />
      ))}
    </ul>
  )
}

function VariationRow({
  product,
  variation: v,
  onAdd,
  getQuantity,
}: {
  product: Product
  variation: ProductVariation
  onAdd: (item: PickedItem) => void
  getQuantity: (productId: number, variationId?: number) => number
}) {
  const [flashing, flash] = useAddedFlash()
  const label = v.attributes.map((a) => a.option).join(" / ")
  const price = effectivePrice(v.regularPrice ?? 0, v.salePrice)
  const productId = Number(product.id)

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-300 hover:bg-muted/50",
        flashing && "bg-emerald-500/10 ring-1 ring-emerald-500/40 hover:bg-emerald-500/10"
      )}
    >
      <span className="truncate text-sm">{label || `#${v.id}`}</span>
      <span className="text-xs text-muted-foreground">{formatCurrency(price)}</span>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <InOrderBadge count={getQuantity(productId, v.id)} />
        <AddButton
          added={flashing}
          onClick={() => {
            onAdd({
              productId,
              variationId: v.id,
              name: product.name,
              variationLabel: label || undefined,
              price,
              imageUrl: v.image?.src || product.images[0]?.src || "",
            })
            flash()
          }}
        />
      </div>
    </li>
  )
}
