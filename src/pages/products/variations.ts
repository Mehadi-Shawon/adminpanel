import type { ProductFormValues } from "./product-schema"

// WooCommerce variable products get unwieldy well before this, and the
// variations batch endpoint caps at 100 per request — so we refuse to generate
// more than this and ask the user to reduce options instead of silently
// truncating.
export const MAX_VARIATIONS = 100

// Control char (0x01) joins option values into a combination key so the values
// themselves can never collide across positions. Never shown to the user.
const KEY_DELIMITER = String.fromCharCode(1)

export interface Combination {
  // Stable key for the ordered option values (used to index the variations map).
  key: string
  // One option value per usable attribute, in attribute order.
  values: string[]
  // Human label, e.g. "Red / Small".
  label: string
}

type AttributeLike = { name: string; options: string[] }

// Only attributes that actually have a name and at least one option contribute
// to the combinations — this must match the filter used when building the
// variation payload so `values[i]` lines up with the attribute at index i.
export function usableAttributes<T extends AttributeLike>(attributes: T[]): T[] {
  return attributes.filter((a) => a.name.trim() !== "" && a.options.length > 0)
}

// Cartesian product of every usable attribute's options.
export function buildCombinations(attributes: AttributeLike[]): Combination[] {
  const usable = usableAttributes(attributes)
  if (usable.length === 0) return []

  let rows: string[][] = [[]]
  for (const attr of usable) {
    const next: string[][] = []
    for (const row of rows) {
      for (const option of attr.options) {
        next.push([...row, option])
      }
    }
    rows = next
  }

  return rows.map((values) => ({
    key: values.join(KEY_DELIMITER),
    values,
    label: values.join(" / "),
  }))
}

// Recreates the combination key for an existing WooCommerce variation so its
// saved data can be slotted back into the form's variations map. Options are
// ordered by the current usable attributes, exactly as buildCombinations does.
export function comboKeyFromVariation(
  variationAttributes: { name: string; option: string }[],
  attributes: AttributeLike[]
): string {
  const optionByName = new Map(variationAttributes.map((a) => [a.name, a.option]))
  return usableAttributes(attributes)
    .map((a) => optionByName.get(a.name) ?? "")
    .join(KEY_DELIMITER)
}

// Turns the form's per-combination map into the WooCommerce variation inputs,
// one per current combination (in combination order).
export function toVariationInputs(values: ProductFormValues) {
  const usable = usableAttributes(values.attributes)
  return buildCombinations(values.attributes).map((combo) => {
    const data = values.variations[combo.key] ?? {}
    return {
      attributes: usable.map((a, i) => ({ name: a.name, option: combo.values[i] })),
      regularPrice: data.regularPrice,
      salePrice: data.salePrice,
      stock: data.stock,
      sku: data.sku,
      image: data.image,
    }
  })
}
