import { z } from "zod"
import { PRODUCT_STATUSES } from "@/lib/product-taxonomy"
import { buildCombinations, MAX_VARIATIONS } from "./variations"

// One custom (product-level) attribute — e.g. { name: "Color", options: ["Red", "Blue"] }.
const attributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required"),
  options: z.array(z.string().min(1)).min(1, "Add at least one option"),
})

// Per-combination data for a variable product's variation (keyed by combination
// key in the `variations` map). All optional — completeness is enforced in the
// superRefine so we can point at the specific missing variation.
const variationSchema = z.object({
  regularPrice: z.number().positive("Regular price must be greater than 0").optional(),
  salePrice: z.number().positive("Must be greater than 0").optional(),
  stock: z.number().int("Stock must be a whole number").min(0, "Stock can't be negative").optional(),
  sku: z.string().optional(),
  image: z.object({ id: z.number(), src: z.string() }).optional(),
})

export const productFormSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sku: z.string().optional(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    shortDescription: z.string().optional(),
    categoryId: z.number(),
    subCategoryId: z.number().optional(),
    brands: z.array(z.number()),
    type: z.enum(["simple", "variable"]),
    // Price/stock apply to simple products only; a variable product's
    // price/stock live on its variations, so these are optional here and
    // enforced per-type in the superRefine below.
    regularPrice: z.number().positive("Regular price must be greater than 0").optional(),
    salePrice: z.number().positive("Must be greater than 0").optional(),
    stock: z.number().int("Stock must be a whole number").min(0, "Stock can't be negative").optional(),
    attributes: z.array(attributeSchema),
    // Variable products only — per-combination data keyed by combination key.
    // Always initialised to {} by the forms (no zod default, so the resolver's
    // input and output types stay identical for react-hook-form).
    variations: z.record(z.string(), variationSchema),
    status: z.enum(PRODUCT_STATUSES),
    images: z.array(z.object({ id: z.number(), src: z.string() })).min(1, "An image is required"),
  })
  // WooCommerce's sale price is the discounted price, so it must be lower than
  // the regular price — otherwise WooCommerce ignores it.
  .refine(
    (v) => v.regularPrice === undefined || v.salePrice === undefined || v.salePrice < v.regularPrice,
    { path: ["salePrice"], message: "Sale price must be lower than the regular price" }
  )
  .superRefine((v, ctx) => {
    if (v.type === "simple") {
      if (v.regularPrice === undefined) {
        ctx.addIssue({ code: "custom", path: ["regularPrice"], message: "Regular price is required" })
      }
      if (v.stock === undefined) {
        ctx.addIssue({ code: "custom", path: ["stock"], message: "Stock is required" })
      }
      return
    }

    // Variable product.
    if (v.attributes.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["attributes"],
        message: "Add at least one attribute (e.g. Color or Size) for a variable product",
      })
      return
    }

    const combos = buildCombinations(v.attributes)
    if (combos.length > MAX_VARIATIONS) {
      ctx.addIssue({
        code: "custom",
        path: ["variations"],
        message: `That's ${combos.length} variations — reduce your options to ${MAX_VARIATIONS} or fewer.`,
      })
      return
    }

    for (const combo of combos) {
      const data = v.variations[combo.key]
      if (!data || data.regularPrice === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["variations"],
          message: `Set a regular price for every variation — "${combo.label}" is missing one.`,
        })
        return
      }
      if (data.salePrice !== undefined && data.salePrice >= data.regularPrice) {
        ctx.addIssue({
          code: "custom",
          path: ["variations"],
          message: `"${combo.label}": sale price must be lower than the regular price.`,
        })
        return
      }
    }
  })

export type ProductFormValues = z.infer<typeof productFormSchema>
