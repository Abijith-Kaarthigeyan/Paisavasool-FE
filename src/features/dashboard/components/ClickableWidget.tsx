import React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

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
    "block h-full min-h-0 w-full rounded-lg border border-border bg-card text-left shadow-card",
    compact ? "p-3" : "p-5",
    "cursor-pointer transition-shadow hover:shadow-md",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
  )

const plainClassName = cn(
  "block w-full text-left",
  "cursor-pointer transition-opacity hover:opacity-95",
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
