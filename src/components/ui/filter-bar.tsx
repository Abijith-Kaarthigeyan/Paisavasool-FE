import React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, type SelectProps } from "@/components/ui/select"

export interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children?: React.ReactNode
  onClear?: () => void
  showClear?: boolean
  className?: string
  /** default = standalone bordered card; toolbar = compact row inside a table card */
  variant?: "default" | "toolbar"
  size?: "default" | "sm"
  footer?: React.ReactNode
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  children,
  onClear,
  showClear,
  className,
  variant = "default",
  size = "default",
  footer,
}: FilterBarProps) {
  const isToolbar = variant === "toolbar"
  const isCompact = size === "sm" || isToolbar

  return (
    <div className={cn(isToolbar ? "space-y-2" : undefined, className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          !isToolbar && "flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center"
        )}
      >
        <div
          className={cn(
            "relative min-w-[10rem] flex-1",
            isCompact ? "sm:max-w-[14rem]" : "sm:max-w-xs"
          )}
        >
          <Search
            className={cn(
              "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
              isCompact ? "h-3.5 w-3.5" : "left-3 h-4 w-4"
            )}
            aria-hidden
          />
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(isCompact ? "h-8 pl-8 text-xs" : "pl-9")}
            aria-label={searchPlaceholder}
          />
        </div>

        {children && (
          <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
        )}

        {showClear && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className={cn(
              "shrink-0 text-muted-foreground",
              isCompact && "h-8 px-2"
            )}
            aria-label="Clear filters"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            <span className={cn(isCompact && "hidden sm:inline")}>Clear filters</span>
          </Button>
        )}
      </div>

      {footer && (
        <div className="text-xs text-muted-foreground sm:text-sm">{footer}</div>
      )}
    </div>
  )
}

/** Compact select sized for filter toolbars — use with aria-label instead of a visible Label */
export function FilterSelect({ className, compact = true, ...props }: SelectProps) {
  return (
    <Select
      compact={compact}
      className={cn("w-[9.5rem] shrink-0", className)}
      {...props}
    />
  )
}

export interface FilterChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean
}

export function FilterChip({ active, className, children, ...props }: FilterChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
