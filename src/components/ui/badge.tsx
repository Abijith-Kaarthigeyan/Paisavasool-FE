import React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "neutral"
    | "ai"
  shape?: "tag" | "pill"
}

export function Badge({
  className,
  variant = "default",
  shape = "tag",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive:
      "border-transparent bg-destructive/10 text-destructive border border-destructive/20",
    outline: "text-foreground border border-border bg-background",
    success:
      "border-transparent bg-success-muted text-success-foreground border border-success/20",
    warning:
      "border-transparent bg-warning-muted text-warning-foreground border border-warning/20",
    info: "border-transparent bg-info-muted text-info-foreground border border-info/20",
    neutral: "border-transparent bg-muted text-muted-foreground border border-border",
    ai: "border-transparent bg-primary/10 text-primary border border-primary/20",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium transition-colors",
        shape === "pill" ? "rounded-full" : "rounded-md",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
