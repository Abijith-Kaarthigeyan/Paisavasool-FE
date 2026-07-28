import React, { useMemo } from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { CHART_COLORS } from "@/lib/design-tokens"
import { ChartHoverTooltip } from "@/components/ui/chart-tooltip"
import type { CollectionCase } from "@/features/collections/types"

interface CollectionStatusChartProps {
  cases: CollectionCase[]
  loading?: boolean
  className?: string
  height?: string
  compact?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  PROMISED: "Promised",
  ESCALATED: "Escalated",
  DISPUTED: "Disputed",
  CLOSED: "Closed",
}

export const CollectionStatusChart: React.FC<CollectionStatusChartProps> = ({
  cases,
  loading = false,
  className,
  height = "h-full",
  compact = false,
}) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    cases.forEach((c) => {
      const stat = c.status || "Unknown"
      counts[stat] = (counts[stat] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name: STATUS_LABELS[name] ?? name.replace(/_/g, " "),
      value,
    }))
  }, [cases])

  return (
    <ChartCard
      title="Collection status"
      loading={loading}
      empty={chartData.length === 0}
      className={className}
      height={height}
      compact={compact}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="65%"
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartHoverTooltip valueLabel="cases" />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
