import React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { widgetHoverLiftClass } from "@/lib/widget-styles"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

const iconToneStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  info: "bg-info-muted text-info",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  destructive: "bg-destructive/10 text-destructive",
} as const

export interface KpiCardTrend {
  value: string
  direction: "up" | "down" | "neutral"
}

export interface KpiCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  iconTone?: keyof typeof iconToneStyles
  trend?: KpiCardTrend
  loading?: boolean
  className?: string
}

export function KpiCard({
  label,
  value,
  icon,
  iconTone = "default",
  trend,
  loading = false,
  className,
}: KpiCardProps) {
  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus

  const trendColor =
    trend?.direction === "up"
      ? "text-success"
      : trend?.direction === "down"
        ? "text-destructive"
        : "text-muted-foreground"

  return (
    <Card className={cn(widgetHoverLiftClass, className)}>
      <CardContent className="flex items-center justify-between p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {loading ? <Skeleton className="h-8 w-20" /> : value}
          </p>
          {trend && !loading && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
              <TrendIcon className="h-3 w-3 shrink-0" aria-hidden />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              iconToneStyles[iconTone]
            )}
            aria-hidden
          >
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export interface KpiGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4 | 5 | 6
}

export function KpiGrid({ columns = 4, className, children, ...props }: KpiGridProps) {
  const colClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : columns === 5
          ? "sm:grid-cols-2 lg:grid-cols-5"
          : columns === 6
            ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
            : "sm:grid-cols-2 lg:grid-cols-4"

  return (
    <div className={cn("grid grid-cols-1 gap-4", colClass, className)} {...props}>
      {children}
    </div>
  )
}
