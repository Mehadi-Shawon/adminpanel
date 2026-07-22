import { useQuery } from "@tanstack/react-query"
import {
  getDashboardStats,
  getKpiSparklines,
  getOrdersByStatus,
  getRecentActivity,
  getRecentOrders,
  getRevenueSeries,
  type DashboardRange,
} from "@/lib/api/dashboard"

export function useDashboardStats(range: DashboardRange = 30) {
  return useQuery({ queryKey: ["dashboard", "stats", range], queryFn: () => getDashboardStats(range) })
}

export function useRevenueSeries(range: DashboardRange = 30) {
  return useQuery({ queryKey: ["dashboard", "revenue", range], queryFn: () => getRevenueSeries(range) })
}

export function useOrdersByStatus() {
  return useQuery({ queryKey: ["dashboard", "orders-by-status"], queryFn: getOrdersByStatus })
}

export function useRecentOrders(limit = 8) {
  return useQuery({ queryKey: ["dashboard", "recent-orders", limit], queryFn: () => getRecentOrders(limit) })
}

export function useRecentActivity(limit = 10) {
  return useQuery({ queryKey: ["dashboard", "recent-activity", limit], queryFn: () => getRecentActivity(limit) })
}

export function useKpiSparklines(days = 14) {
  return useQuery({ queryKey: ["dashboard", "sparklines", days], queryFn: () => getKpiSparklines(days) })
}
