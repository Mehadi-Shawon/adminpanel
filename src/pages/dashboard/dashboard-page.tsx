import { useState } from "react"
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useDashboardStats,
  useKpiSparklines,
  useOrdersByStatus,
  useRecentActivity,
  useRecentOrders,
  useRevenueSeries,
} from "@/hooks/use-dashboard"
import type { DashboardRange } from "@/lib/api/dashboard"
import { formatCurrency } from "@/lib/format"
import { StatCard } from "./components/stat-card"
import { RevenueChart } from "./components/revenue-chart"
import { OrdersStatusChart } from "./components/orders-status-chart"
import { RecentOrdersTable } from "./components/recent-orders-table"
import { RecentActivityFeed } from "./components/recent-activity-feed"

const RANGE_OPTIONS: DashboardRange[] = [7, 30, 90]

export function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>(30)
  const stats = useDashboardStats(range)
  const revenue = useRevenueSeries(range)
  const statusBreakdown = useOrdersByStatus()
  const recentOrders = useRecentOrders(8)
  const recentActivity = useRecentActivity(8)
  const sparklines = useKpiSparklines(14)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">An overview of your store's performance.</p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border p-1">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={option === range ? "secondary" : "ghost"}
              onClick={() => setRange(option)}
            >
              {option}d
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.isPending || !stats.data
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : (
            <>
              <StatCard
                title="Total revenue"
                value={formatCurrency(stats.data.totalRevenue)}
                changePct={stats.data.revenueChangePct}
                icon={DollarSign}
                accentColor="var(--viz-blue)"
                sparklineId="revenue"
                sparklineData={sparklines.data?.revenue}
              />
              <StatCard
                title="Orders"
                value={stats.data.totalOrders.toLocaleString()}
                changePct={stats.data.ordersChangePct}
                icon={ShoppingCart}
                accentColor="var(--viz-orange)"
                sparklineId="orders"
                sparklineData={sparklines.data?.orders}
              />
              <StatCard
                title="New customers"
                value={stats.data.newCustomers.toLocaleString()}
                changePct={stats.data.customersChangePct}
                icon={Users}
                accentColor="var(--viz-aqua)"
                sparklineId="customers"
                sparklineData={sparklines.data?.customers}
              />
              <StatCard
                title="Avg order value"
                value={formatCurrency(stats.data.avgOrderValue)}
                changePct={stats.data.avgOrderChangePct}
                icon={TrendingUp}
                accentColor="var(--viz-magenta)"
                sparklineId="avg-order"
                sparklineData={sparklines.data?.avgOrderValue}
              />
            </>
          )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {revenue.isPending || !revenue.data ? (
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        ) : (
          <RevenueChart data={revenue.data} />
        )}
        {statusBreakdown.isPending || !statusBreakdown.data ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : (
          <OrdersStatusChart data={statusBreakdown.data} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {recentOrders.isPending || !recentOrders.data ? (
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        ) : (
          <RecentOrdersTable orders={recentOrders.data} />
        )}
        {recentActivity.isPending || !recentActivity.data ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (
          <RecentActivityFeed items={recentActivity.data} />
        )}
      </div>
    </div>
  )
}
