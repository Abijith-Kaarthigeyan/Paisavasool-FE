import { cn } from "@/lib/utils"
import { getConfidenceLevel, type ConfidenceLevel } from "@/lib/design-tokens"

const levelStyles: Record<
  ConfidenceLevel,
  { bar: string; text: string; track: string }
> = {
  high: {
    bar: "bg-success",
    text: "text-success",
    track: "bg-success-muted",
  },
  medium: {
    bar: "bg-warning",
    text: "text-warning",
    track: "bg-warning-muted",
  },
  low: {
    bar: "bg-destructive",
    text: "text-destructive",
    track: "bg-destructive/10",
  },
}

const sizeStyles = {
  sm: { bar: "h-1", text: "text-xs", gap: "gap-1.5" },
  md: { bar: "h-1.5", text: "text-sm", gap: "gap-2" },
  lg: { bar: "h-2", text: "text-base", gap: "gap-2" },
} as const

export interface ConfidenceMeterProps {
  value: number
  label?: string
  showValue?: boolean
  size?: keyof typeof sizeStyles
  className?: string
}

export function ConfidenceMeter({
  value,
  label,
  showValue = true,
  size = "md",
  className,
}: ConfidenceMeterProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const level = getConfidenceLevel(clamped)
  const styles = levelStyles[level]
  const sizeConfig = sizeStyles[size]

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className={cn("mb-1 flex items-center justify-between", sizeConfig.gap)}>
          {label && (
            <span className={cn("font-medium text-muted-foreground", sizeConfig.text)}>
              {label}
            </span>
          )}
          {showValue && (
            <span
              className={cn("font-semibold tabular-nums", sizeConfig.text, styles.text)}
              aria-live="polite"
            >
              {clamped.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn("w-full overflow-hidden rounded-full", styles.track, sizeConfig.bar)}
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${clamped.toFixed(1)}%` : `Confidence: ${clamped.toFixed(1)}%`}
      >
        <div
          className={cn("rounded-full transition-all duration-300", styles.bar, sizeConfig.bar)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
