import type { Customer, CustomerStatus } from "@/types"
import { wcGetList } from "./wc-client"
import { getOrders } from "./orders"

export interface CustomerQuery {
  search?: string
  status?: CustomerStatus
}

// --- WooCommerce customer shape (only the fields we read) ---
interface WcCustomer {
  id: number
  email: string
  first_name: string
  last_name: string
  billing: { phone: string; city: string; country: string }
  date_created: string
}

// WooCommerce has no active/inactive concept for customers (they're just WP
// users with the "customer" role) — every real customer maps to "active".
// The status filter/toggle in the UI stays, but toggling is a client-side-
// only affordance until there's a real field to persist it against.
const localStatusOverrides = new Map<string, CustomerStatus>()

async function mapCustomer(wc: WcCustomer, orderTotals: Map<string, { count: number; spent: number }>): Promise<Customer> {
  const id = String(wc.id)
  const totals = orderTotals.get(id) ?? { count: 0, spent: 0 }
  return {
    id,
    name: `${wc.first_name} ${wc.last_name}`.trim() || wc.email,
    email: wc.email,
    phone: wc.billing.phone,
    city: wc.billing.city,
    country: wc.billing.country,
    status: localStatusOverrides.get(id) ?? "active",
    totalOrders: totals.count,
    totalSpent: totals.spent,
    createdAt: wc.date_created,
  }
}

async function buildOrderTotals() {
  const orders = await getOrders()
  const totals = new Map<string, { count: number; spent: number }>()
  for (const order of orders) {
    const entry = totals.get(order.customerId) ?? { count: 0, spent: 0 }
    entry.count += 1
    entry.spent += order.total
    totals.set(order.customerId, entry)
  }
  return totals
}

export async function getCustomers(params?: CustomerQuery): Promise<Customer[]> {
  const [{ data }, orderTotals] = await Promise.all([
    wcGetList<WcCustomer>("customers", { search: params?.search, role: "customer" }),
    buildOrderTotals(),
  ])
  let results = await Promise.all(data.map((wc) => mapCustomer(wc, orderTotals)))

  if (params?.status) {
    results = results.filter((c) => c.status === params.status)
  }
  return results
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const customers = await getCustomers()
  return customers.find((c) => c.id === id)
}

export function getCustomerOrders(customerId: string) {
  return getOrders({ customerId })
}

export async function toggleCustomerStatus(id: string): Promise<Customer> {
  const current = await getCustomer(id)
  if (!current) throw new Error("Customer not found")
  const next: CustomerStatus = current.status === "active" ? "inactive" : "active"
  localStatusOverrides.set(id, next)
  return { ...current, status: next }
}
