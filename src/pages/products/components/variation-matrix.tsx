import { useId, useState } from "react"
import { Controller, useWatch, type Control } from "react-hook-form"
import { toast } from "sonner"
import { ImagePlus, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldLabel } from "@/components/ui/field"
import { useUploadMedia } from "@/hooks/use-products"
import type { ProductImage } from "@/types"
import type { ProductFormValues } from "../product-schema"
import { buildCombinations, MAX_VARIATIONS, type Combination } from "../variations"

type VariationsMap = ProductFormValues["variations"]
type VariationData = VariationsMap[string]

interface VariationMatrixProps {
  control: Control<ProductFormValues>
}

// Renders one editable row per attribute-value combination (Red / S, Red / M …)
// and keeps the form's `variations` map — keyed by combination key — in sync.
export function VariationMatrix({ control }: VariationMatrixProps) {
  const attributes = useWatch({ control, name: "attributes" }) ?? []
  const combos = buildCombinations(attributes)

  if (combos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add attributes with options above to generate variations.
      </p>
    )
  }

  if (combos.length > MAX_VARIATIONS) {
    return (
      <p className="text-sm text-destructive">
        That&apos;s {combos.length} variations — reduce your options to {MAX_VARIATIONS} or fewer.
      </p>
    )
  }

  return (
    <Controller
      control={control}
      name="variations"
      render={({ field }) => {
        const map = field.value ?? {}
        const patch = (key: string, changes: Partial<VariationData>) =>
          field.onChange({ ...map, [key]: { ...map[key], ...changes } })

        return (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldLabel>Variations ({combos.length})</FieldLabel>
              <BulkApply combos={combos} map={map} onChange={field.onChange} />
            </div>
            {combos.map((combo) => (
              <VariationRow
                key={combo.key}
                label={combo.label}
                data={map[combo.key]}
                onChange={(changes) => patch(combo.key, changes)}
              />
            ))}
          </div>
        )
      }}
    />
  )
}

interface BulkApplyProps {
  combos: Combination[]
  map: VariationsMap
  onChange: (map: VariationsMap) => void
}

// Fills a regular price and/or stock across every variation at once — the
// common case when a variable product shares pricing across variants.
function BulkApply({ combos, map, onChange }: BulkApplyProps) {
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")

  function apply() {
    const next = { ...map }
    for (const combo of combos) {
      next[combo.key] = {
        ...next[combo.key],
        ...(price !== "" ? { regularPrice: Number(price) } : {}),
        ...(stock !== "" ? { stock: Number(stock) } : {}),
      }
    }
    onChange(next)
    setPrice("")
    setStock("")
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        step="1"
        placeholder="Reg. price"
        className="h-8 w-24"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Input
        type="number"
        step="1"
        placeholder="Stock"
        className="h-8 w-20"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={apply}
        disabled={price === "" && stock === ""}
      >
        Apply to all
      </Button>
    </div>
  )
}

interface VariationRowProps {
  label: string
  data: VariationData | undefined
  onChange: (changes: Partial<VariationData>) => void
}

function VariationRow({ label, data, onChange }: VariationRowProps) {
  const toNum = (v: string) => (v === "" ? undefined : Number(v))

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <VariationImage value={data?.image} onChange={(image) => onChange({ image })} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input
          type="number"
          step="1"
          placeholder="Regular price"
          value={data?.regularPrice ?? ""}
          onChange={(e) => onChange({ regularPrice: toNum(e.target.value) })}
        />
        <Input
          type="number"
          step="1"
          placeholder="Sale price"
          value={data?.salePrice ?? ""}
          onChange={(e) => onChange({ salePrice: toNum(e.target.value) })}
        />
        <Input
          type="number"
          step="1"
          placeholder="Stock"
          value={data?.stock ?? ""}
          onChange={(e) => onChange({ stock: toNum(e.target.value) })}
        />
        <Input
          placeholder="SKU"
          value={data?.sku ?? ""}
          onChange={(e) => onChange({ sku: e.target.value || undefined })}
        />
      </div>
    </div>
  )
}

interface VariationImageProps {
  value: ProductImage | undefined
  onChange: (image: ProductImage | undefined) => void
}

function VariationImage({ value, onChange }: VariationImageProps) {
  const uploadMedia = useUploadMedia()
  const inputId = useId()

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files can be uploaded.")
      return
    }
    try {
      onChange(await uploadMedia.mutateAsync(file))
    } catch (error) {
      toast.error("Failed to upload image", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  if (value) {
    return (
      <div className="relative">
        <img
          src={value.src}
          alt=""
          className="size-9 rounded object-cover ring-1 ring-foreground/10"
        />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 text-destructive ring-1 ring-border"
          aria-label="Remove variation image"
        >
          <X className="size-3" />
        </button>
      </div>
    )
  }

  return (
    <>
      <label
        htmlFor={inputId}
        className="flex size-9 cursor-pointer items-center justify-center rounded border border-dashed text-muted-foreground transition-colors hover:text-foreground"
        title="Add variation image"
      >
        {uploadMedia.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploadMedia.isPending}
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
    </>
  )
}
