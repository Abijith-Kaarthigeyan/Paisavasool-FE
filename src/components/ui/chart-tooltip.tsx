import { cn } from "@/lib/utils"

export function formatChartLabel(label: string): string {
  return label.replace(/_/g, " ")
}

interface ChartHoverTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string }>
  label?: string
  valueLabel?: string
  className?: string
}

/** Minimal hover tooltip for recharts — shows segment/bar label and count. */
export function ChartHoverTooltip({
  active,
  payload,
  label,
  valueLabel = "disputes",
  className,
}: ChartHoverTooltipProps) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  const name = formatChartLabel(String(label ?? entry.name ?? ""))
  const value = entry.value ?? 0

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-card",
        className
      )}
    >
      <p className="font-semibold text-foreground">{name}</p>
      <p className="mt-0.5 tabular-nums text-muted-foreground">
        {value} {valueLabel}
      </p>
    </div>
  )
}
