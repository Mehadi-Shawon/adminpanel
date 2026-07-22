import type { Category, Product, ProductImage, ProductStatus, ProductType } from "@/types"
import { stripHtml } from "@/lib/format"
import { wcGet, wcGetList, wcPost, wcPut, wcUploadMedia } from "./wc-client"

// WooCommerce can return category names carrying HTML/entities; clean them for
// display. We only ever send category ids back, so this never round-trips.
function mapCategory(c: Category): Category {
  return { ...c, name: stripHtml(c.name) }
}

export interface ProductQuery {
  search?: string
  categoryId?: number
  status?: ProductStatus
}

// What the form collects for one variation attribute (custom, product-level).
export interface ProductAttributeInput {
  name: string
  options: string[]
}

// One concrete variation of a variable product — a specific combination of
// attribute values (e.g. Color=Red, Size=S) with its own price/stock/SKU/image.
export interface VariationInput {
  attributes: { name: string; option: string }[]
  regularPrice?: number
  salePrice?: number
  stock?: number
  sku?: string
  image?: ProductImage
}

export interface ProductInput {
  name: string
  sku?: string
  description: string
  shortDescription?: string
  categories: Category[]
  type: ProductType
  // Simple products only — a variable product's price/stock come from its
  // variations, so these are optional and ignored when type === "variable".
  regularPrice?: number
  salePrice?: number
  stock?: number
  attributes: ProductAttributeInput[]
  // Variable products only — created in a second step after the parent.
  variations?: VariationInput[]
  status: ProductStatus
  images: ProductImage[]
}

// --- WooCommerce product shape (only the fields we read) ---
interface WcProductAttribute {
  id: number
  name: string
  options: string[]
  variation: boolean
  visible: boolean
}

interface WcProduct {
  id: number
  name: string
  sku: string
  description: string
  short_description: string
  categories: Category[]
  images: ProductImage[]
  type: string
  attributes: WcProductAttribute[]
  regular_price: string
  sale_price: string
  stock_quantity: number | null
  status: string
  date_created: string
}

interface WcVariation {
  id: number
  sku: string
  regular_price: string
  sale_price: string
  stock_quantity: number | null
  attributes: { name: string; option: string }[]
  image: { id: number; src: string } | null
}

// A variation loaded back from WooCommerce, shaped for the edit form.
export interface ProductVariation {
  id: number
  attributes: { name: string; option: string }[]
  regularPrice?: number
  salePrice?: number
  stock?: number
  sku?: string
  image?: ProductImage
}

function mapVariation(v: WcVariation): ProductVariation {
  return {
    id: v.id,
    attributes: (v.attributes ?? []).map((a) => ({ name: a.name, option: a.option })),
    regularPrice: v.regular_price ? parseFloat(v.regular_price) : undefined,
    salePrice: v.sale_price ? parseFloat(v.sale_price) : undefined,
    stock: v.stock_quantity ?? undefined,
    sku: v.sku || undefined,
    image: v.image ? { id: v.image.id, src: v.image.src } : undefined,
  }
}

function mapProduct(wc: WcProduct): Product {
  return {
    id: String(wc.id),
    name: wc.name,
    sku: wc.sku,
    description: wc.description,
    shortDescription: wc.short_description || undefined,
    categories: (wc.categories ?? []).map(mapCategory),
    type: wc.type === "variable" ? "variable" : "simple",
    regularPrice: parseFloat(wc.regular_price) || 0,
    salePrice: wc.sale_price ? parseFloat(wc.sale_price) : undefined,
    stock: wc.stock_quantity ?? 0,
    attributes: (wc.attributes ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      options: a.options ?? [],
      variation: a.variation,
      visible: a.visible,
    })),
    status: wc.status as ProductStatus,
    images: wc.images,
    createdAt: wc.date_created,
  }
}

// We now model prices exactly as WooCommerce does — `regularPrice`/`salePrice`
// map straight onto `regular_price`/`sale_price`, no translation.
//
// For a variable product the parent carries no price/stock (those live on the
// variations, saved separately via the variations endpoint) — it only carries
// the `attributes` (each flagged `variation: true`) that define which values
// the variations combine. Custom, product-level attributes are sent with
// `id: 0` and matched by `name`, which is exactly what WooCommerce expects.
function toWcPayload(input: ProductInput) {
  const base = {
    name: input.name,
    sku: input.sku,
    description: input.description,
    short_description: input.shortDescription ?? "",
    categories: input.categories.map((c) => ({ id: c.id })),
    images: input.images.map((img) => ({ id: img.id })),
    type: input.type,
    status: input.status,
    attributes: input.attributes.map((a, position) => ({
      id: 0,
      name: a.name,
      position,
      visible: true,
      variation: true,
      options: a.options,
    })),
  }

  if (input.type === "variable") {
    return base
  }

  const stock = input.stock ?? 0
  return {
    ...base,
    regular_price: String(input.regularPrice ?? 0),
    sale_price: input.salePrice !== undefined ? String(input.salePrice) : "",
    manage_stock: true,
    stock_quantity: stock,
    stock_status: stock > 0 ? "instock" : "outofstock",
  }
}

export async function getProductCategories(): Promise<Category[]> {
  const { data } = await wcGetList<Category>("products/categories", { orderby: "name", order: "asc" })
  return data.map(mapCategory)
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

// One variation as the WooCommerce variations endpoint expects it. `attributes`
// reference the parent's variation attributes by name + the chosen option.
function toWcVariationPayload(v: VariationInput) {
  const manageStock = v.stock !== undefined
  return {
    regular_price: v.regularPrice !== undefined ? String(v.regularPrice) : "",
    sale_price: v.salePrice !== undefined ? String(v.salePrice) : "",
    sku: v.sku || undefined,
    manage_stock: manageStock,
    stock_quantity: manageStock ? v.stock : undefined,
    stock_status: manageStock ? (v.stock! > 0 ? "instock" : "outofstock") : undefined,
    image: v.image ? { id: v.image.id } : undefined,
    attributes: v.attributes.map((a) => ({ name: a.name, option: a.option })),
  }
}

// Creates the variations for a variable product. Uses the batch endpoint (max
// 100 per call), chunking to stay within that limit rather than truncating.
export async function createProductVariations(
  productId: string,
  variations: VariationInput[]
): Promise<void> {
  const CHUNK = 100
  for (let i = 0; i < variations.length; i += CHUNK) {
    const chunk = variations.slice(i, i + CHUNK)
    await wcPost(`products/${productId}/variations/batch`, {
      create: chunk.map(toWcVariationPayload),
    })
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  // Step 1: create the parent product (with its attributes for variable types).
  const wc = await wcPost<WcProduct>("products", toWcPayload(input))
  const product = mapProduct(wc)

  // Step 2: for a variable product, create its variations against the new id.
  if (input.type === "variable" && input.variations && input.variations.length > 0) {
    await createProductVariations(product.id, input.variations)
  }

  return product
}

export async function getProductVariations(productId: string): Promise<ProductVariation[]> {
  const { data } = await wcGetList<WcVariation>(`products/${productId}/variations`)
  return data.map(mapVariation)
}

// Order-independent key identifying a variation by its attribute values, used to
// match desired variations against the ones already in WooCommerce.
function variationMatchKey(attributes: { name: string; option: string }[]): string {
  return [...attributes]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => `${a.name}=${a.option}`)
    .join("|")
}

// Reconciles a variable product's variations with the desired set: existing
// combinations are updated, new ones created, and removed ones deleted — all in
// one batch call (create/update/delete), which is exactly how WooCommerce
// expects bulk variation edits.
export async function syncProductVariations(
  productId: string,
  desired: VariationInput[]
): Promise<void> {
  const existing = await getProductVariations(productId)
  const existingIdByKey = new Map(existing.map((v) => [variationMatchKey(v.attributes), v.id]))
  const desiredKeys = new Set(desired.map((d) => variationMatchKey(d.attributes)))

  const create: unknown[] = []
  const update: unknown[] = []
  for (const variation of desired) {
    const id = existingIdByKey.get(variationMatchKey(variation.attributes))
    if (id) {
      update.push({ id, ...toWcVariationPayload(variation) })
    } else {
      create.push(toWcVariationPayload(variation))
    }
  }
  const del = existing.filter((v) => !desiredKeys.has(variationMatchKey(v.attributes))).map((v) => v.id)

  if (create.length === 0 && update.length === 0 && del.length === 0) return

  await wcPost(`products/${productId}/variations/batch`, { create, update, delete: del })
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const wc = await wcPut<WcProduct>(`products/${id}`, toWcPayload(input))
  const product = mapProduct(wc)

  // For a variable product, create/update/delete variations to match the
  // submitted set. Simple products are skipped (no per-save variations GET); a
  // variable→simple conversion may leave orphan variations, but WooCommerce
  // ignores them for a simple product so it's harmless.
  if (input.type === "variable") {
    await syncProductVariations(id, input.variations ?? [])
  }

  return product
}

// Mirrors WooCommerce's real two-step image flow: upload to the WordPress
// Media Library first (POST /wp/v2/media), then attach the returned id to
// the product via categories/images on save.
export async function uploadMedia(file: File): Promise<ProductImage> {
  const media = await wcUploadMedia(file)
  return { id: media.id, src: media.source_url }
}
