import React, { useMemo } from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { CHART_COLORS } from "@/lib/design-tokens"
import { WidgetNavLink } from "./WidgetNavLink"
import { ChartHoverTooltip } from "@/components/ui/chart-tooltip"

export interface DisputeCategoryDatum {
  dispute_category?: string | null
}

interface DisputeCategoryChartProps {
  disputes: DisputeCategoryDatum[]
  loading?: boolean
  className?: string
  height?: string
  compact?: boolean
  showFooter?: boolean
}

export const DisputeCategoryChart: React.FC<DisputeCategoryChartProps> = ({
  disputes,
  loading = false,
  className,
  height = "h-full",
  compact = false,
  showFooter = false,
}) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    disputes.forEach((d) => {
      const cat = d.dispute_category || "Unclassified"
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [disputes])

  const footer = showFooter ? (
    <WidgetNavLink to="/disputes">Go to Dispute dashboard</WidgetNavLink>
  ) : undefined

  return (
    <ChartCard
      title="Disputes by category"
      description={compact ? undefined : "Volume segmented by classification."}
      loading={loading}
      empty={chartData.length === 0}
      className={className}
      height={height}
      compact={compact}
      footer={footer}
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
          <Tooltip content={<ChartHoverTooltip valueLabel="disputes" />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
