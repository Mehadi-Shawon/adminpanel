// Matches WordPress/WooCommerce's real product (post) statuses — there is
// no native "active"/"archived"; a live product is "publish", and an
// unpublished one is "draft" (or "pending" review / "private").
export type ProductStatus = "draft" | "pending" | "private" | "publish"

// Matches WooCommerce's real product category shape — a taxonomy term
// with a numeric id, not a bare string. `parent` is the id of the parent
// term (0 for a top-level category); it drives the category → sub-category
// cascade. It's optional because the copy embedded in a product's own
// `categories` array omits it — only the categories endpoint returns it.
export interface Category {
  id: number
  name: string
  slug: string
  parent?: number
  // Number of products in this category (WooCommerce term `count`). Absent on
  // the copy embedded in a product's own `categories` array.
  count?: number
}

// WooCommerce's product brand taxonomy term (product_brand). Same shape as a
// category term — brands can also be hierarchical, though we treat them flat.
export interface Brand {
  id: number
  name: string
  slug: string
  count?: number
}

// A store-wide (global) product attribute — the taxonomy managed under
// WooCommerce → Attributes (products/attributes endpoint), distinct from the
// per-product custom attributes in ProductAttribute above. "select" attributes
// have predefined terms; "text" attributes are free-form.
export type AttributeType = "select" | "text"

export interface GlobalAttribute {
  id: number
  name: string
  slug: string
  type: AttributeType
}

// Matches WooCommerce's real product image shape (an array, first = featured).
export interface ProductImage {
  id: number
  src: string
}

// A "simple" product is a single SKU/price; a "variable" product has
// variations (e.g. per colour/size). These are WooCommerce's real product
// types — we only support these two.
export type ProductType = "simple" | "variable"

// Matches WooCommerce's real product attribute shape. For a variable product
// each attribute used for variations has `variation: true`; `options` are the
// possible values (e.g. ["Red", "Blue"]). `id` is 0 for a custom (product-
// level) attribute and non-zero for a global (pa_*) taxonomy attribute.
export interface ProductAttribute {
  id: number
  name: string
  options: string[]
  variation: boolean
  visible: boolean
}

export interface Product {
  id: string
  name: string
  sku: string
  description: string
  shortDescription?: string
  categories: Category[]
  brands: Brand[]
  type: ProductType
  // WooCommerce's real pricing model: `regularPrice` is the normal price and
  // `salePrice` (optional, always lower) is the discounted price. For a
  // variable product these live on the variations, not the parent, so
  // regularPrice can be 0 and stock null/0.
  regularPrice: number
  salePrice?: number
  stock: number
  attributes: ProductAttribute[]
  status: ProductStatus
  images: ProductImage[]
  createdAt: string
}
