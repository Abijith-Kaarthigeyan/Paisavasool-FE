import React, { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { isEmptyFilterValue } from "@/lib/table"
import type {
  ColumnFilterConfig,
  ColumnFilterValue,
  DateRangeFilterValue,
  NumberRangeFilterValue,
} from "@/lib/table"

export interface ColumnFilterPopoverProps {
  config: ColumnFilterConfig
  value?: ColumnFilterValue
  onChange: (value: ColumnFilterValue | undefined) => void
  onApply?: () => void
}

export function ColumnFilterPopover({
  config,
  value,
  onChange,
  onApply,
}: ColumnFilterPopoverProps) {
  const [draft, setDraft] = useState<ColumnFilterValue | undefined>(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const apply = (next: ColumnFilterValue | undefined = draft) => {
    onChange(isEmptyFilterValue(next) ? undefined : next)
    onApply?.()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault()
      apply()
    }
  }

  if (config.type === "text") {
    return (
      <div className="space-y-2" onKeyDown={handleKeyDown}>
        <Label htmlFor="column-filter-text" className="text-xs text-muted-foreground">
          Contains
        </Label>
        <Input
          id="column-filter-text"
          autoFocus
          value={typeof draft === "string" ? draft : ""}
          placeholder={config.placeholder ?? "Filter…"}
          className="h-8 text-xs"
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={() => apply(undefined)}>
            Clear
          </Button>
          <Button type="button" size="sm" onClick={() => apply()}>
            Apply
          </Button>
        </div>
      </div>
    )
  }

  if (config.type === "select") {
    return (
      <div className="space-y-2" onKeyDown={handleKeyDown}>
        <Label htmlFor="column-filter-select" className="text-xs text-muted-foreground">
          Equals
        </Label>
        <Select
          id="column-filter-select"
          compact
          autoFocus
          value={typeof draft === "string" ? draft : ""}
          onChange={(e) => {
            const next = e.target.value
            setDraft(next)
            onChange(next || undefined)
            onApply?.()
          }}
        >
          <option value="">{config.placeholder ?? "Any"}</option>
          {(config.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
    )
  }

  if (config.type === "date-range") {
    const range = (draft && typeof draft === "object" && "from" in draft
      ? draft
      : {}) as DateRangeFilterValue

    return (
      <div className="space-y-2" onKeyDown={handleKeyDown}>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="column-filter-from" className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id="column-filter-from"
              type="date"
              className="h-8 text-xs"
              value={range.from ?? ""}
              onChange={(e) =>
                setDraft({
                  ...range,
                  from: e.target.value || undefined,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="column-filter-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="column-filter-to"
              type="date"
              className="h-8 text-xs"
              value={range.to ?? ""}
              onChange={(e) =>
                setDraft({
                  ...range,
                  to: e.target.value || undefined,
                })
              }
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={() => apply(undefined)}>
            Clear
          </Button>
          <Button type="button" size="sm" onClick={() => apply()}>
            Apply
          </Button>
        </div>
      </div>
    )
  }

  // number-range
  const range = (draft && typeof draft === "object" && "min" in draft
    ? draft
    : {}) as NumberRangeFilterValue

  const parseNum = (raw: string): number | undefined => {
    if (raw.trim() === "") return undefined
    const n = Number(raw)
    return Number.isNaN(n) ? undefined : n
  }

  return (
    <div className="space-y-2" onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="column-filter-min" className="text-xs text-muted-foreground">
            Min
          </Label>
          <Input
            id="column-filter-min"
            type="number"
            inputMode="decimal"
            className="h-8 text-xs"
            value={range.min ?? ""}
            placeholder={config.placeholder}
            onChange={(e) =>
              setDraft({
                ...range,
                min: parseNum(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="column-filter-max" className="text-xs text-muted-foreground">
            Max
          </Label>
          <Input
            id="column-filter-max"
            type="number"
            inputMode="decimal"
            className="h-8 text-xs"
            value={range.max ?? ""}
            onChange={(e) =>
              setDraft({
                ...range,
                max: parseNum(e.target.value),
              })
            }
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" size="sm" onClick={() => apply(undefined)}>
          Clear
        </Button>
        <Button type="button" size="sm" onClick={() => apply()}>
          Apply
        </Button>
      </div>
    </div>
  )
}
