import React from "react"
import { cn } from "@/lib/utils"

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Timeline({ className, children, ...props }: TimelineProps) {
  return (
    <div className={cn("relative space-y-4 pl-4", className)} {...props}>
      <div
        className="absolute bottom-2 left-[7px] top-2 w-px bg-border"
        aria-hidden
      />
      {children}
    </div>
  )
}

const itemToneStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  destructive: "bg-destructive/10 text-destructive",
} as const

export interface TimelineItemProps {
  icon?: React.ReactNode
  title: React.ReactNode
  timestamp?: React.ReactNode
  description?: React.ReactNode
  tone?: keyof typeof itemToneStyles
  className?: string
}

export function TimelineItem({
  icon,
  title,
  timestamp,
  description,
  tone = "default",
  className,
}: TimelineItemProps) {
  return (
    <div className={cn("relative", className)}>
      <span
        className={cn(
          "absolute -left-4 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-card",
          itemToneStyles[tone]
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 pl-2">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-medium text-foreground">{title}</div>
          {timestamp && (
            <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {timestamp}
            </time>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
