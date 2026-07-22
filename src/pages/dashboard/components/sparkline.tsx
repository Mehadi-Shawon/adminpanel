import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface SparklineProps {
  data: number[]
  color: string
  id: string
}

export function Sparkline({ data, color, id }: SparklineProps) {
  const points = data.map((value, index) => ({ index, value }))
  const gradientId = `spark-${id}`

  return (
    <div className="h-9 w-20 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 1, bottom: 1, left: 1 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            dataKey="value"
            type="monotone"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
