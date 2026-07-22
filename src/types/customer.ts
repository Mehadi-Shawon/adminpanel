export type CustomerStatus = "active" | "inactive"

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  country: string
  status: CustomerStatus
  totalOrders: number
  totalSpent: number
  createdAt: string
}
