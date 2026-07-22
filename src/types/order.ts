// Matches WooCommerce's real core order statuses (there is no native
// "shipped" status — "processing" covers paid/being-fulfilled and
// "completed" covers done).
export type OrderStatus =
  | "pending"
  | "processing"
  | "on-hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed"

export interface OrderItem {
  productId: string
  productName: string
  imageUrl: string
  quantity: number
  unitPrice: number
}

export interface ShippingAddress {
  line1: string
  city: string
  state: string
  zip: string
  country: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  shippingAddress: ShippingAddress
  createdAt: string
  updatedAt: string
}
