import { useMemo, useState } from "react"
import { ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ColumnFilterPopover } from "@/components/ui/column-filter-popover"
import { isEmptyFilterValue } from "@/lib/table"
import type { ColumnDef, ColumnFilterConfig, ColumnFilterValue, FilterValues } from "@/lib/table"

export interface MobileColumnFiltersProps<T> {
  columns: ColumnDef<T>[]
  filters: FilterValues
  onFilterChange: (columnId: string, value: ColumnFilterValue | undefined) => void
  className?: string
}

/** Compact entry point for column filters on narrow viewports (headers stay quiet). */
export function MobileColumnFilters<T>({
  columns,
  filters,
  onFilterChange,
  className,
}: MobileColumnFiltersProps<T>) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const filterable = useMemo(
    () => columns.filter((col) => !!col.filter),
    [columns]
  )

  const activeCount = filterable.filter(
    (col) => !isEmptyFilterValue(filters[col.id])
  ).length

  const activeColumn = filterable.find((col) => col.id === activeId)

  if (filterable.length === 0) return null

  return (
    <div className={cn("md:hidden", className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setActiveId(null)
        }}
      >
        <PopoverTrigger
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-xs font-medium",
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            activeCount > 0 && "border-primary/30 text-foreground"
          )}
          aria-label="Column filters"
        >
          <ListFilter className="h-3.5 w-3.5" aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {activeCount}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          {activeColumn?.filter ? (
            <div>
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setActiveId(null)}
                >
                  ← Back
                </button>
                <span className="text-xs font-medium text-foreground">
                  {activeColumn.label}
                </span>
              </div>
              <div className="p-3">
                <ColumnFilterPopover
                  config={activeColumn.filter as ColumnFilterConfig}
                  value={filters[activeColumn.id]}
                  onChange={(next) => onFilterChange(activeColumn.id, next)}
                  onApply={() => {
                    setActiveId(null)
                    setOpen(false)
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                Column filters
              </div>
              {filterable.map((col) => {
                const active = !isEmptyFilterValue(filters[col.id])
                return (
                  <button
                    key={col.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-muted",
                      active && "text-foreground"
                    )}
                    onClick={() => setActiveId(col.id)}
                  >
                    <span>{col.label}</span>
                    {active ? (
                      <span className="text-[10px] font-medium text-primary">On</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Add</span>
                    )}
                  </button>
                )
              })}
              {activeCount > 0 && (
                <div className="border-t border-border p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full text-xs"
                    onClick={() => {
                      filterable.forEach((col) => onFilterChange(col.id, undefined))
                      setOpen(false)
                    }}
                  >
                    Clear column filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
