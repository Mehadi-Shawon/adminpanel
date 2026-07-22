import { z } from "zod"
import { PRODUCT_STATUSES } from "@/lib/product-taxonomy"

export const productFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().optional(),
  categoryId: z.number(),
  price: z.number().positive("Price must be greater than 0"),
  compareAtPrice: z.number().positive("Must be greater than 0").optional(),
  stock: z.number().int("Stock must be a whole number").min(0, "Stock can't be negative"),
  status: z.enum(PRODUCT_STATUSES),
  images: z.array(z.object({ id: z.number(), src: z.string() })).min(1, "An image is required"),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
