import type { Category, Product, ProductImage, ProductStatus } from "@/types"
import { wcGet, wcGetList, wcPost, wcPut, wcUploadMedia } from "./wc-client"

export interface ProductQuery {
  search?: string
  categoryId?: number
  status?: ProductStatus
}

export interface ProductInput {
  name: string
  sku?: string
  description: string
  shortDescription?: string
  categories: Category[]
  price: number
  compareAtPrice?: number
  stock: number
  status: ProductStatus
  images: ProductImage[]
}

// --- WooCommerce product shape (only the fields we read) ---
interface WcProduct {
  id: number
  name: string
  sku: string
  description: string
  short_description: string
  categories: Category[]
  images: ProductImage[]
  regular_price: string
  sale_price: string
  stock_quantity: number | null
  status: string
  date_created: string
}

function mapProduct(wc: WcProduct): Product {
  const regular = parseFloat(wc.regular_price) || 0
  const sale = wc.sale_price ? parseFloat(wc.sale_price) : undefined

  return {
    id: String(wc.id),
    name: wc.name,
    sku: wc.sku,
    description: wc.description,
    shortDescription: wc.short_description || undefined,
    categories: wc.categories,
    price: sale ?? regular,
    compareAtPrice: sale !== undefined ? regular : undefined,
    stock: wc.stock_quantity ?? 0,
    status: wc.status as ProductStatus,
    images: wc.images,
    createdAt: wc.date_created,
  }
}

// Field mapping is NOT 1:1 by name — our `price` (what the customer pays
// now) maps to WooCommerce's `sale_price` when `compareAtPrice` is set (with
// `regular_price` set to `compareAtPrice`), or straight to `regular_price`
// when there's no discount.
function toWcPayload(input: ProductInput) {
  const hasDiscount = input.compareAtPrice !== undefined && input.compareAtPrice > input.price
  return {
    name: input.name,
    sku: input.sku,
    description: input.description,
    short_description: input.shortDescription ?? "",
    categories: input.categories.map((c) => ({ id: c.id })),
    images: input.images.map((img) => ({ id: img.id })),
    regular_price: String(hasDiscount ? input.compareAtPrice : input.price),
    sale_price: hasDiscount ? String(input.price) : "",
    type: "simple",
    manage_stock: true,
    stock_quantity: input.stock,
    stock_status: input.stock > 0 ? "instock" : "outofstock",
    status: input.status,
  }
}

export async function getProductCategories(): Promise<Category[]> {
  const { data } = await wcGetList<Category>("products/categories", { orderby: "name", order: "asc" })
  return data
}

export async function getProducts(params?: ProductQuery): Promise<Product[]> {
  const { data } = await wcGetList<WcProduct>("products", {
    search: params?.search,
    category: params?.categoryId,
    status: params?.status,
  })
  return data.map(mapProduct)
}

export async function getProduct(id: string): Promise<Product | undefined> {
  try {
    const wc = await wcGet<WcProduct>(`products/${id}`)
    return mapProduct(wc)
  } catch {
    return undefined
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const wc = await wcPost<WcProduct>("products", toWcPayload(input))
  return mapProduct(wc)
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const wc = await wcPut<WcProduct>(`products/${id}`, toWcPayload(input))
  return mapProduct(wc)
}

// Mirrors WooCommerce's real two-step image flow: upload to the WordPress
// Media Library first (POST /wp/v2/media), then attach the returned id to
// the product via categories/images on save.
export async function uploadMedia(file: File): Promise<ProductImage> {
  const media = await wcUploadMedia(file)
  return { id: media.id, src: media.source_url }
}
