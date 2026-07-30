import type { Order, OrderItem, OrderStatus, ShippingAddress } from "@/types"
import { stripHtml } from "@/lib/format"
import { wcGet, wcGetList, wcPost, wcPut } from "./wc-client"

export interface OrderQuery {
  search?: string
  status?: OrderStatus
  customerId?: string
}

// --- WooCommerce order shape (only the fields we read) ---
interface WcOrder {
  id: number
  number: string
  status: string
  date_created: string
  date_modified: string
  total: string
  shipping_total: string
  customer_id: number
  billing: {
    first_name: string
    last_name: string
    phone: string
    email: string
    address_1: string
    city: string
    state: string
    postcode: string
    country: string
  }
  line_items: Array<{
    product_id: number
    variation_id?: number
    name: string
    quantity: number
    price: number
    image?: { id: number; src: string }
    // Variation attributes surface here as { display_key, display_value }
    // pairs (e.g. Color/Red); internal meta keys start with "_".
    meta_data?: Array<{ key: string; display_key?: string; display_value?: string }>
  }>
  fee_lines?: Array<{ name: string; total: string }>
  // Order-level custom fields. createOrder writes the advance payment details
  // here; unrelated plugins write their own keys, so always look ours up by name.
  meta_data?: Array<{ key: string; value: unknown }>
}

// Order meta keys for the advance payment details. Deliberately human-readable
// and without a leading underscore, so WooCommerce also lists them in the order
// screen's "Custom Fields" box rather than hiding them as internal meta.
const META_TXN_ID = "Advance Transaction ID"
const META_TXN_NUMBER = "Advance Payment Number"

function readMeta(wc: WcOrder, key: string): string | undefined {
  const hit = (wc.meta_data ?? []).find((m) => m.key === key)
  if (hit == null || hit.value == null) return undefined
  const value = String(hit.value).trim()
  return value === "" ? undefined : value
}

function mapOrder(wc: WcOrder): Order {
  const total = parseFloat(wc.total) || 0
  const shipping = parseFloat(wc.shipping_total) || 0

  // A negative fee line is money already taken off the order — see the
  // "Advance paid" line createOrder writes. WooCommerce has already folded it
  // into `total`, so add it back to recover the real goods subtotal.
  const feeTotal = (wc.fee_lines ?? []).reduce((sum, fee) => sum + (parseFloat(fee.total) || 0), 0)
  const advancePaid = feeTotal < 0 ? -feeTotal : 0

  const items: OrderItem[] = wc.line_items.map((item) => {
    // Build a readable variation label from the line item's attribute meta.
    const attributes = (item.meta_data ?? [])
      .filter(
        (m) =>
          m.display_key &&
          m.display_value &&
          !m.display_key.startsWith("_") &&
          !String(m.key).startsWith("_")
      )
      .map((m) => stripHtml(String(m.display_value)))
    return {
      productId: String(item.product_id),
      variationId: item.variation_id ? String(item.variation_id) : undefined,
      variationLabel: attributes.length ? attributes.join(" / ") : undefined,
      productName: item.name,
      imageUrl: item.image?.src ?? "",
      quantity: item.quantity,
      unitPrice: item.price,
    }
  })

  const shippingAddress: ShippingAddress = {
    line1: wc.billing.address_1,
    city: wc.billing.city,
    state: wc.billing.state,
    zip: wc.billing.postcode,
    country: wc.billing.country,
  }

  return {
    id: String(wc.id),
    orderNumber: `#${wc.number}`,
    customerId: String(wc.customer_id),
    customerName: `${wc.billing.first_name} ${wc.billing.last_name}`.trim(),
    customerPhone: wc.billing.phone,
    items,
    subtotal: total - shipping + advancePaid,
    shipping,
    advancePaid,
    advanceTxnId: readMeta(wc, META_TXN_ID),
    advanceTxnNumber: readMeta(wc, META_TXN_NUMBER),
    total,
    status: wc.status as OrderStatus,
    shippingAddress,
    createdAt: wc.date_created,
    updatedAt: wc.date_modified,
  }
}

export async function getOrders(params?: OrderQuery): Promise<Order[]> {
  const { data } = await wcGetList<WcOrder>("orders", {
    search: params?.search,
    status: params?.status,
    customer: params?.customerId,
    orderby: "date",
    order: "desc",
  })
  return data.map(mapOrder)
}

export async function getOrder(id: string): Promise<Order | undefined> {
  try {
    const wc = await wcGet<WcOrder>(`orders/${id}`)
    return mapOrder(wc)
  } catch {
    return undefined
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const wc = await wcPut<WcOrder>(`orders/${id}`, { status })
  return mapOrder(wc)
}

// One line for a manually-created order. `variationId` is set when a specific
// variation of a variable product was chosen.
export interface CustomOrderItemInput {
  productId: number
  variationId?: number
  quantity: number
}

export interface CreateOrderInput {
  firstName: string
  lastName?: string
  phone: string
  // The freeform street address goes into address_1.
  address: string
  // WooCommerce has no "town" field, so town maps to address_2 (a real,
  // non-lossy secondary address line) and city maps to billing.city.
  town?: string
  city?: string
  email?: string
  // Free order note (WooCommerce customer_note). The order source
  // (Facebook/Instagram/WhatsApp) is appended so it also shows on the order.
  note?: string
  source?: string
  // Amount the customer already paid up front (bKash/Nagad/bank). Sent as a
  // negative fee line so WooCommerce subtracts it and the order total becomes
  // what the courier still has to collect on delivery.
  advanceAmount?: number
  // How that advance arrived: the mobile-banking/bank transaction reference and
  // the number it was sent from. Stored as order meta so the payment can be
  // reconciled later. Only meaningful alongside a non-zero advanceAmount.
  advanceTxnId?: string
  advanceTxnNumber?: string
  // Flat delivery charge per the store's policy (see lib/delivery-charge).
  // Passed in rather than derived here so the created order matches the total
  // the admin was shown in the preview.
  deliveryCharge?: number
  status: OrderStatus
  items: CustomOrderItemInput[]
}

// Drops keys that are undefined or blank. WooCommerce format-validates
// billing.email, and an empty string fails that check — the whole request comes
// back as "Invalid parameter(s): billing" when the admin leaves Email empty. An
// omitted field is simply left unset, which is what a blank input means anyway.
function withoutBlanks(fields: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value.trim() !== "")
  )
}

// Creates a manual order (guest, Cash on Delivery). WooCommerce computes the
// line/order totals itself from product_id + quantity — we don't send prices.
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const advance = input.advanceAmount && input.advanceAmount > 0 ? input.advanceAmount : 0
  const delivery = input.deliveryCharge && input.deliveryCharge > 0 ? input.deliveryCharge : 0
  const noteParts = [input.note?.trim(), input.source ? `Source: ${input.source}` : ""].filter(
    Boolean
  )
  // Only recorded when an advance was actually taken — a transaction ID with no
  // payment behind it would just be noise on the order.
  const advanceMeta = advance
    ? [
        { key: META_TXN_ID, value: input.advanceTxnId?.trim() },
        { key: META_TXN_NUMBER, value: input.advanceTxnNumber?.trim() },
      ].filter((m): m is { key: string; value: string } => !!m.value)
    : []
  const wc = await wcPost<WcOrder>("orders", {
    status: input.status,
    customer_id: 0,
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    set_paid: false,
    customer_note: noteParts.length ? noteParts.join("\n\n") : undefined,
    billing: withoutBlanks({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
      email: input.email,
      address_1: input.address,
      address_2: input.town,
      city: input.city,
    }),
    shipping: withoutBlanks({
      first_name: input.firstName,
      last_name: input.lastName,
      address_1: input.address,
      address_2: input.town,
      city: input.city,
    }),
    line_items: input.items.map((item) => ({
      product_id: item.productId,
      variation_id: item.variationId,
      quantity: item.quantity,
    })),
    // A fee line with a negative total is how WooCommerce records money already
    // taken off an order. tax_status "none" keeps it out of tax calculations —
    // it's a payment, not a discount on the goods.
    fee_lines: advance
      ? [{ name: "Advance paid", total: String(-advance), tax_status: "none" }]
      : [],
    // Free delivery sends no line at all, so shipping_total stays 0 and the
    // order reads as "Free" everywhere instead of carrying a 0৳ charge line.
    shipping_lines: delivery
      ? [{ method_id: "flat_rate", method_title: "Delivery charge", total: String(delivery) }]
      : [],
    meta_data: advanceMeta,
  })
  return mapOrder(wc)
}
