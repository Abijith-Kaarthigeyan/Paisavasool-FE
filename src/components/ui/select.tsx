import React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  compact?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, compact = false, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex w-full appearance-none rounded-md border border-input bg-background text-foreground",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          compact
            ? "h-8 px-2.5 py-1 pr-8 text-xs"
            : "h-10 px-3 py-2 pr-9 text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          compact ? "right-2 h-3.5 w-3.5" : "right-3 h-4 w-4"
        )}
        aria-hidden
      />
    </div>
  )
)
Select.displayName = "Select"
