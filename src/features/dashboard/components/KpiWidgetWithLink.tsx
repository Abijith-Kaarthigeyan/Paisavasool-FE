import React from "react"
import { cn } from "@/lib/utils"
import { widgetHoverLiftClass } from "@/lib/widget-styles"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { WidgetNavLink } from "./WidgetNavLink"
import type { KpiCardProps } from "@/components/ui/kpi-card"

const iconToneStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  info: "bg-info-muted text-info",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  destructive: "bg-destructive/10 text-destructive",
} as const

interface KpiWidgetWithLinkProps extends KpiCardProps {
  to: string
  linkLabel: string
}

export const KpiWidgetWithLink: React.FC<KpiWidgetWithLinkProps> = ({
  label,
  value,
  icon,
  iconTone = "default",
  loading = false,
  className,
  to,
  linkLabel,
}) => {
  return (
    <Card className={cn("flex flex-col border-border shadow-card", widgetHoverLiftClass, className)}>
      <CardContent className="flex flex-1 items-center justify-between p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {loading ? <Skeleton className="h-8 w-20" /> : value}
          </p>
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
      <div className="shrink-0 px-4 pb-4 pt-1">
        <WidgetNavLink to={to}>{linkLabel}</WidgetNavLink>
      </div>
    </Card>
  )
}
