import { subDays, isAfter, format } from "date-fns"
import { getOrders } from "./orders"
import { getCustomers } from "./customers"

// Each function below independently fetches orders/customers — WooCommerce
// has no single "dashboard" endpoint that returns all of this pre-aggregated,
// so it's computed here from the real order/customer lists. That means this
// page issues several separate requests rather than one; fine for a small
// store, worth revisiting (e.g. a shared query, or WooCommerce's Reports
// API) if the catalog/order volume grows.

export type DashboardRange = 7 | 30 | 90

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  newCustomers: number
  avgOrderValue: number
  revenueChangePct: number
  ordersChangePct: number
  customersChangePct: number
  avgOrderChangePct: number
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return 0
  return Math.round(((curr - prev) / prev) * 1000) / 10
}

export async function getDashboardStats(range: DashboardRange = 30): Promise<DashboardStats> {
  const orders = await getOrders()
  const now = new Date()
  const start = subDays(now, range)
  const prevStart = subDays(start, range)

  const current = orders.filter((o) => isAfter(new Date(o.createdAt), start))
  const previous = orders.filter(
    (o) => isAfter(new Date(o.createdAt), prevStart) && !isAfter(new Date(o.createdAt), start)
  )

  const sum = (list: typeof current) => list.reduce((s, o) => s + o.total, 0)
  const currentRevenue = sum(current)
  const previousRevenue = sum(previous)
  const currentAvg = current.length ? currentRevenue / current.length : 0
  const previousAvg = previous.length ? previousRevenue / previous.length : 0
  const currentCustomers = new Set(current.map((o) => o.customerId)).size
  const previousCustomers = new Set(previous.map((o) => o.customerId)).size

  return {
    totalRevenue: Math.round(currentRevenue * 100) / 100,
    totalOrders: current.length,
    newCustomers: currentCustomers,
    avgOrderValue: Math.round(currentAvg * 100) / 100,
    revenueChangePct: pctChange(currentRevenue, previousRevenue),
    ordersChangePct: pctChange(current.length, previous.length),
    customersChangePct: pctChange(currentCustomers, previousCustomers),
    avgOrderChangePct: pctChange(currentAvg, previousAvg),
  }
}

export interface RevenuePoint {
  date: string
  revenue: number
}

export async function getRevenueSeries(range: DashboardRange = 30): Promise<RevenuePoint[]> {
  const orders = await getOrders()
  const days = Array.from({ length: range }, (_, i) => subDays(new Date(), range - 1 - i))

  return days.map((day) => {
    const key = format(day, "yyyy-MM-dd")
    const dayRevenue = orders
      .filter((o) => format(new Date(o.createdAt), "yyyy-MM-dd") === key)
      .reduce((s, o) => s + o.total, 0)
    return { date: key, revenue: Math.round(dayRevenue * 100) / 100 }
  })
}

export interface StatusBreakdown {
  status: string
  count: number
}

export async function getOrdersByStatus(): Promise<StatusBreakdown[]> {
  const orders = await getOrders()
  const counts = new Map<string, number>()
  for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1)
  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }))
}

export async function getRecentOrders(limit = 8) {
  const orders = await getOrders()
  return [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export interface KpiSparklines {
  revenue: number[]
  orders: number[]
  customers: number[]
  avgOrderValue: number[]
}

export async function getKpiSparklines(days = 14): Promise<KpiSparklines> {
  const [orders, customers] = await Promise.all([getOrders(), getCustomers()])
  const daySlots = Array.from({ length: days }, (_, i) => subDays(new Date(), days - 1 - i))

  const revenue: number[] = []
  const ordersCount: number[] = []
  const customersCount: number[] = []

  for (const day of daySlots) {
    const key = format(day, "yyyy-MM-dd")
    const dayOrders = orders.filter((o) => format(new Date(o.createdAt), "yyyy-MM-dd") === key)
    revenue.push(Math.round(dayOrders.reduce((s, o) => s + o.total, 0)))
    ordersCount.push(dayOrders.length)
    customersCount.push(customers.filter((c) => format(new Date(c.createdAt), "yyyy-MM-dd") === key).length)
  }

  const avgOrderValue = revenue.map((r, i) => (ordersCount[i] ? Math.round(r / ordersCount[i]) : 0))

  return { revenue, orders: ordersCount, customers: customersCount, avgOrderValue }
}

export interface ActivityItem {
  id: string
  type: "order" | "customer"
  title: string
  timestamp: string
  href: string
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const [orders, customers] = await Promise.all([getOrders(), getCustomers()])

  const orderEvents: ActivityItem[] = orders.map((o) => ({
    id: `order-${o.id}`,
    type: "order",
    title: `New order ${o.orderNumber} placed by ${o.customerName}`,
    timestamp: o.createdAt,
    href: `/orders?view=${o.id}`,
  }))

  const customerEvents: ActivityItem[] = customers.map((c) => ({
    id: `customer-${c.id}`,
    type: "customer",
    title: `${c.name} joined as a new customer`,
    timestamp: c.createdAt,
    href: `/customers/${c.id}`,
  }))

  return [...orderEvents, ...customerEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}
