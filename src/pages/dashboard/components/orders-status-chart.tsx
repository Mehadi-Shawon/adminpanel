import { Cell, Legend, Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { StatusBreakdown } from "@/lib/api/dashboard"

const STATUS_CONFIG: ChartConfig = {
  pending: { label: "Pending", theme: { light: "#2a78d6", dark: "#3987e5" } },
  processing: { label: "Processing", theme: { light: "#eb6834", dark: "#d95926" } },
  "on-hold": { label: "On Hold", theme: { light: "#eda100", dark: "#c98500" } },
  completed: { label: "Completed", theme: { light: "#008300", dark: "#008300" } },
  cancelled: { label: "Cancelled", theme: { light: "#e34948", dark: "#e66767" } },
  refunded: { label: "Refunded", theme: { light: "#4a3aa7", dark: "#9085e9" } },
  failed: { label: "Failed", theme: { light: "#1baf7a", dark: "#199e70" } },
}

export function OrdersStatusChart({ data }: { data: StatusBreakdown[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by status</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={STATUS_CONFIG} className="mx-auto aspect-square h-64">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
            <Pie data={data} dataKey="count" nameKey="status" innerRadius={56} strokeWidth={2}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={`var(--color-${entry.status})`} />
              ))}
            </Pie>
            <Legend content={<ChartLegendContent nameKey="status" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
