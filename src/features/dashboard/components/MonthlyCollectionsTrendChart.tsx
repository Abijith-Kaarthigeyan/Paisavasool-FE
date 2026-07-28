import React, { useMemo } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { CHART_COLORS } from "@/lib/design-tokens"
import { WidgetNavLink } from "./WidgetNavLink"
import type { CollectionCase } from "@/features/collections/types"

interface MonthlyDatum {
  month: string
  label: string
  collected: number
}

function buildMonthlyTrend(cases: CollectionCase[], monthCount = 6): MonthlyDatum[] {
  const now = new Date()
  const buckets: MonthlyDatum[] = []

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString(undefined, { month: "short" }),
      collected: 0,
    })
  }

  cases.forEach((c) => {
    const outstanding = c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot
    const collected = Math.max(0, c.outstanding_amount_snapshot - outstanding)
    if (collected <= 0) return

    const dateStr = c.closed_at || c.updated_at || c.opened_at
    const date = new Date(dateStr)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const bucket = buckets.find((b) => b.month === key)
    if (bucket) bucket.collected += collected
  })

  return buckets
}

interface MonthlyCollectionsTrendChartProps {
  cases: CollectionCase[]
  loading?: boolean
  className?: string
  height?: string
  compact?: boolean
  showFooter?: boolean
}

export const MonthlyCollectionsTrendChart: React.FC<MonthlyCollectionsTrendChartProps> = ({
  cases,
  loading = false,
  className,
  height = "h-full",
  compact = false,
  showFooter = false,
}) => {
  const chartData = useMemo(() => buildMonthlyTrend(cases), [cases])

  const isEmpty = chartData.every((d) => d.collected === 0)

  const footer = showFooter ? (
    <WidgetNavLink to="/customers">View customers</WidgetNavLink>
  ) : undefined

  return (
    <ChartCard
      title="Monthly collections trend"
      loading={loading}
      empty={
        isEmpty
          ? { title: "No collection data", description: "Collected amounts will appear here over time." }
          : false
      }
      className={className}
      height={height}
      compact={compact}
      footer={footer}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[2]} stopOpacity={0.35} />
              <stop offset="95%" stopColor={CHART_COLORS[2]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="label" fontSize={9} fontWeight={600} tick={{ fill: "#6B7280" }} />
          <YAxis
            fontSize={9}
            fontWeight={600}
            tick={{ fill: "#6B7280" }}
            tickFormatter={(v) => `₹${Number(v).toLocaleString(undefined, { notation: "compact" })}`}
          />
          <Tooltip
            formatter={(v: number | string) => [
              `₹${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              "Collected",
            ]}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              borderRadius: "6px",
              border: "1px solid hsl(var(--border))",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="collected"
            stroke={CHART_COLORS[2]}
            strokeWidth={2}
            fill="url(#collectedGradient)"
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
