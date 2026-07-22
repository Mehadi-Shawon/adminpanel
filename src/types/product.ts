// Matches WordPress/WooCommerce's real product (post) statuses — there is
// no native "active"/"archived"; a live product is "publish", and an
// unpublished one is "draft" (or "pending" review / "private").
export type ProductStatus = "draft" | "pending" | "private" | "publish"

// Matches WooCommerce's real product category shape — a taxonomy term
// with a numeric id, not a bare string.
export interface Category {
  id: number
  name: string
  slug: string
}

// Matches WooCommerce's real product image shape (an array, first = featured).
export interface ProductImage {
  id: number
  src: string
}

export interface Product {
  id: string
  name: string
  sku: string
  description: string
  shortDescription?: string
  categories: Category[]
  price: number
  compareAtPrice?: number
  stock: number
  status: ProductStatus
  images: ProductImage[]
  createdAt: string
}
