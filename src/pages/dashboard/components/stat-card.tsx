import type { LucideIcon } from "lucide-react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Sparkline } from "./sparkline"

interface StatCardProps {
  title: string
  value: string
  changePct: number
  icon: LucideIcon
  accentColor: string
  sparklineId: string
  sparklineData?: number[]
}

export function StatCard({
  title,
  value,
  changePct,
  icon: Icon,
  accentColor,
  sparklineId,
  sparklineData,
}: StatCardProps) {
  const isPositive = changePct >= 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className="flex size-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in oklch, ${accentColor} 15%, transparent)`, color: accentColor }}
        >
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-2xl font-semibold tabular-nums">{value}</span>
          <span
            className={cn(
              "flex flex-wrap items-center gap-0.5 text-xs font-medium",
              isPositive ? "text-[#006300] dark:text-[#0ca30c]" : "text-destructive"
            )}
          >
            {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(changePct)}%
            <span className="ml-1 font-normal text-muted-foreground">vs last period</span>
          </span>
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} color={accentColor} id={sparklineId} />
        )}
      </CardContent>
    </Card>
  )
}
