import { Link } from "react-router-dom"
import { Inbox, Package, UserPlus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/format"
import type { ActivityItem } from "@/lib/api/dashboard"

const ICONS = {
  order: Package,
  customer: UserPlus,
} as const

const COLORS = {
  order: "var(--viz-orange)",
  customer: "var(--viz-aqua)",
} as const

export function RecentActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <Inbox className="size-6" />
            <p className="text-sm">Nothing has happened yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {items.map((item, index) => {
            const Icon = ICONS[item.type]
            const color = COLORS[item.type]
            const isLast = index === items.length - 1

            return (
              <li key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`, color }}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  {!isLast && <div className="my-1 w-px flex-1 bg-border" />}
                </div>
                <div className={`flex flex-1 flex-col gap-0.5 ${isLast ? "" : "pb-4"}`}>
                  <Link to={item.href} className="text-sm leading-snug hover:underline">
                    {item.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
