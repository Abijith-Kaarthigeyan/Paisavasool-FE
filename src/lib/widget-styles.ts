import { cn } from "@/lib/utils"

/** Shared card chrome for dashboard / KPI widgets. */
export const widgetSurfaceClass =
  "rounded-lg border border-border bg-card shadow-card"

/** Subtle 3D lift + deeper shadow on hover (matches Total outstanding widget). */
export const widgetHoverLiftClass = cn(
  "transition-[box-shadow,transform] duration-200 ease-out",
  "hover:-translate-y-0.5 hover:shadow-widget-hover",
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
)

export const widgetInteractiveClass = cn(widgetSurfaceClass, widgetHoverLiftClass)
