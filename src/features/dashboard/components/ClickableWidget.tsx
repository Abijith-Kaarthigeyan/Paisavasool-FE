import React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { widgetInteractiveClass } from "@/lib/widget-styles"

interface ClickableWidgetBaseProps {
  className?: string
  children: React.ReactNode
  title?: string
  /** Plain variant wraps children without adding card chrome (for chart cards). */
  variant?: "card" | "plain"
  compact?: boolean
}

interface ClickableWidgetLinkProps extends ClickableWidgetBaseProps {
  to: string
  onClick?: never
}

interface ClickableWidgetButtonProps extends ClickableWidgetBaseProps {
  to?: never
  onClick: () => void
}

export type ClickableWidgetProps = ClickableWidgetLinkProps | ClickableWidgetButtonProps

const widgetClassName = (compact?: boolean) =>
  cn(
    "block h-full min-h-0 w-full text-left",
    widgetInteractiveClass,
    compact ? "p-3" : "p-5",
    "cursor-pointer",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
  )

const plainClassName = cn(
  "block w-full text-left",
  "cursor-pointer transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-widget-hover",
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 rounded-lg"
)

export const ClickableWidget: React.FC<ClickableWidgetProps> = ({
  className,
  children,
  title,
  variant = "card",
  compact = false,
  ...props
}) => {
  const styles = variant === "plain" ? plainClassName : widgetClassName(compact)

  if ("to" in props && props.to) {
    return (
      <Link to={props.to} title={title} className={cn(styles, className)}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      title={title}
      onClick={props.onClick}
      className={cn(styles, className)}
    >
      {children}
    </button>
  )
}
