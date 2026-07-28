import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { AGING_BUCKET_CHART_COLORS } from "@/lib/design-tokens"
import type { AgingAnalytics } from "@/features/collections/types"
import { WidgetNavLink } from "./WidgetNavLink"
import {
  AGING_CHART_BUCKETS,
  getAgingBucketDrillDownPath,
} from "../utils/chartDrillDown"

interface AgingBucketChartProps {
  aging?: AgingAnalytics | null
  loading?: boolean
  className?: string
  height?: string
  compact?: boolean
  showFooter?: boolean
  title?: string
  description?: string
}

export const AgingBucketChart: React.FC<AgingBucketChartProps> = ({
  aging,
  loading = false,
  className,
  height = "h-full",
  compact = false,
  showFooter = false,
  title = "Aging distribution",
  description,
}) => {
  const navigate = useNavigate()

  const chartData = useMemo(() => {
    if (!aging) return []
    return AGING_CHART_BUCKETS.map(({ name, bucket }) => ({
      name,
      bucket,
      Amount:
        bucket === "90_PLUS"
          ? aging["90_PLUS"] || 0
          : aging[bucket as keyof AgingAnalytics] ?? 0,
    }))
  }, [aging])

  const isEmpty =
    chartData.length === 0 || chartData.every((bucket) => bucket.Amount === 0)

  const footer = showFooter ? (
    <WidgetNavLink to="/collections">Go to collections dashboard</WidgetNavLink>
  ) : undefined

  return (
    <ChartCard
      title={title}
      description={description ?? (compact ? undefined : "Outstanding balance by bucket.")}
      loading={loading}
      empty={
        isEmpty
          ? { title: "No aging data", description: "No active collection aging data." }
          : false
      }
      className={className}
      height={height}
      compact={compact}
      footer={footer}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="name" fontSize={9} fontWeight={600} tick={{ fill: "#6B7280" }} />
          <YAxis
            fontSize={9}
            fontWeight={600}
            tick={{ fill: "#6B7280" }}
            tickFormatter={(v) => `₹${v.toLocaleString(undefined, { notation: "compact" })}`}
          />
          <Tooltip formatter={(v: number | string) => [`₹${Number(v).toLocaleString()}`, "Outstanding"]} />
          <Bar dataKey="Amount" radius={[4, 4, 0, 0]} cursor="pointer">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={AGING_BUCKET_CHART_COLORS[index % AGING_BUCKET_CHART_COLORS.length]}
                onClick={() => navigate(getAgingBucketDrillDownPath(entry.bucket))}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
