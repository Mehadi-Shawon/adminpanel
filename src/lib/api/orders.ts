import type { Order, OrderItem, OrderStatus, ShippingAddress } from "@/types"
import { wcGet, wcGetList, wcPut } from "./wc-client"

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
    name: string
    quantity: number
    price: number
    image?: { id: number; src: string }
  }>
}

function mapOrder(wc: WcOrder): Order {
  const total = parseFloat(wc.total) || 0
  const shipping = parseFloat(wc.shipping_total) || 0

  const items: OrderItem[] = wc.line_items.map((item) => ({
    productId: String(item.product_id),
    productName: item.name,
    imageUrl: item.image?.src ?? "",
    quantity: item.quantity,
    unitPrice: item.price,
  }))

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
    subtotal: total - shipping,
    shipping,
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
