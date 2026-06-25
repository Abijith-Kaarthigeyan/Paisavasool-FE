import React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children?: React.ReactNode
  onClear?: () => void
  showClear?: boolean
  className?: string
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  children,
  onClear,
  showClear,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
          aria-label={searchPlaceholder}
        />
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}

      {showClear && onClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="shrink-0 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Clear filters
        </Button>
      )}
    </div>
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
