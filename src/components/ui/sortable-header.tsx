import React, { useState } from "react"
import { ArrowDown, ArrowUp, ListFilter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableHead } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ColumnFilterPopover } from "@/components/ui/column-filter-popover"
import { isEmptyFilterValue } from "@/lib/table"
import type { ColumnDef, ColumnFilterConfig, ColumnFilterValue, SortState } from "@/lib/table"

export interface SortableHeaderProps<T> {
  column: ColumnDef<T>
  sort: SortState
  onSort: (columnId: string) => void
  filterValue?: ColumnFilterValue
  onFilterChange?: (columnId: string, value: ColumnFilterValue | undefined) => void
  className?: string
}

export function SortableHeader<T>({
  column,
  sort,
  onSort,
  filterValue,
  onFilterChange,
  className,
}: SortableHeaderProps<T>) {
  const [filterOpen, setFilterOpen] = useState(false)
  const isSorted = sort?.id === column.id
  const filterActive = !isEmptyFilterValue(filterValue)
  const align = column.align ?? "left"
  const canFilter = !!column.filter && !!onFilterChange
  const canSort = !!column.sortable

  const ariaSort: React.AriaAttributes["aria-sort"] = !isSorted
    ? "none"
    : sort!.direction === "asc"
      ? "ascending"
      : "descending"

  const SortIcon = isSorted ? (sort!.direction === "asc" ? ArrowUp : ArrowDown) : null

  return (
    <TableHead
      className={cn(
        "group/header",
        align === "center" && "text-center",
        align === "right" && "text-right",
        column.className,
        className
      )}
      aria-sort={canSort ? ariaSort : undefined}
    >
      <div
        className={cn(
          "inline-flex max-w-full items-center gap-0.5",
          align === "center" && "justify-center",
          align === "right" && "ml-auto justify-end"
        )}
      >
        {canSort ? (
          <button
            type="button"
            onClick={() => onSort(column.id)}
            aria-label={
              isSorted
                ? `Sort ${column.label}, currently ${
                    sort!.direction === "asc" ? "ascending" : "descending"
                  }. Activate to change sort.`
                : `Sort by ${column.label}`
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-sm px-0.5 py-0.5 text-xs font-medium",
              "text-muted-foreground hover:text-foreground",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30",
              isSorted && "text-foreground"
            )}
          >
            <span className="truncate">{column.label}</span>
            {SortIcon && <SortIcon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />}
          </button>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">{column.label}</span>
        )}

        {canFilter && (
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger
              aria-label={`Filter ${column.label}`}
              className={cn(
                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30",
                // Hide per-column icons on narrow screens — MobileColumnFilters covers that
                "max-md:hidden",
                "opacity-0 transition-opacity group-hover/header:opacity-100 group-focus-within/header:opacity-100",
                "focus-visible:opacity-100 md:focus-visible:opacity-100",
                "md:[@media(hover:none)]:opacity-70",
                (filterActive || filterOpen) && "md:opacity-100 md:text-foreground"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <ListFilter className="h-3 w-3" aria-hidden />
            </PopoverTrigger>
            <PopoverContent
              align={align === "right" ? "end" : "start"}
              className="w-64 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-medium text-foreground">Filter {column.label}</span>
                {filterActive && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      onFilterChange?.(column.id, undefined)
                      setFilterOpen(false)
                    }}
                  >
                    <X className="h-3 w-3" aria-hidden />
                    Clear
                  </button>
                )}
              </div>
              <div className="p-3">
                <ColumnFilterPopover
                  config={column.filter as ColumnFilterConfig}
                  value={filterValue}
                  onChange={(next) => onFilterChange?.(column.id, next)}
                  onApply={() => setFilterOpen(false)}
                />
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </TableHead>
  )
}
