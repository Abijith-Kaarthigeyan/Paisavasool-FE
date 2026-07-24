import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FilterChip } from "@/components/ui/filter-bar"
import { Button } from "@/components/ui/button"
import type { ActiveFilterChip } from "@/lib/table"

export interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[]
  onRemove: (id: string) => void
  onClearAll?: () => void
  showClearAll?: boolean
  className?: string
}

export function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
  showClearAll,
  className,
}: ActiveFilterChipsProps) {
  if (chips.length === 0 && !showClearAll) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {chips.map((chip) => (
        <FilterChip
          key={chip.id}
          active
          className="gap-1 py-0.5 pl-2 pr-1"
        >
          <span className="max-w-[14rem] truncate">
            <span className="text-muted-foreground">{chip.label}:</span> {chip.valueLabel}
          </span>
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            className="inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-primary/15"
            onClick={() => onRemove(chip.id)}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </FilterChip>
      ))}

      {showClearAll && onClearAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs text-muted-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  )
}
