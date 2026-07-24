import type {
  Accessor,
  ColumnDef,
  ColumnFilterValue,
  DateRangeFilterValue,
  FilterValues,
  NumberRangeFilterValue,
  SortState,
} from "./types"

export function getRowValue<T>(row: T, accessor: Accessor<T> | undefined, fallbackId: string): unknown {
  if (typeof accessor === "function") {
    return accessor(row)
  }

  const path = accessor ?? fallbackId
  if (!path.includes(".")) {
    return (row as Record<string, unknown>)[path]
  }

  return path.split(".").reduce<unknown>((current, key) => {
    if (current == null || typeof current !== "object") return undefined
    return (current as Record<string, unknown>)[key]
  }, row)
}

export function isEmptyFilterValue(value: ColumnFilterValue | undefined): boolean {
  if (value == null) return true
  if (typeof value === "string") return value.trim() === ""
  if (typeof value === "object") {
    if ("from" in value || "to" in value) {
      const range = value as DateRangeFilterValue
      return !range.from && !range.to
    }
    if ("min" in value || "max" in value) {
      const range = value as NumberRangeFilterValue
      return range.min == null && range.max == null
    }
  }
  return false
}

function matchesText(cell: unknown, filter: string): boolean {
  return String(cell ?? "")
    .toLowerCase()
    .includes(filter.trim().toLowerCase())
}

function matchesSelect(cell: unknown, filter: string): boolean {
  return String(cell ?? "") === filter
}

function matchesDateRange(cell: unknown, filter: DateRangeFilterValue): boolean {
  if (cell == null || cell === "") return false
  const time = new Date(String(cell)).getTime()
  if (Number.isNaN(time)) return false

  if (filter.from) {
    const from = new Date(filter.from)
    from.setHours(0, 0, 0, 0)
    if (time < from.getTime()) return false
  }

  if (filter.to) {
    const to = new Date(filter.to)
    to.setHours(23, 59, 59, 999)
    if (time > to.getTime()) return false
  }

  return true
}

function matchesNumberRange(cell: unknown, filter: NumberRangeFilterValue): boolean {
  const n = typeof cell === "number" ? cell : Number(cell)
  if (Number.isNaN(n)) return false
  if (filter.min != null && n < filter.min) return false
  if (filter.max != null && n > filter.max) return false
  return true
}

export function matchesColumnFilter(
  cell: unknown,
  type: NonNullable<ColumnDef<unknown>["filter"]>["type"],
  value: ColumnFilterValue
): boolean {
  switch (type) {
    case "text":
      return matchesText(cell, String(value))
    case "select":
      return matchesSelect(cell, String(value))
    case "date-range":
      return matchesDateRange(cell, value as DateRangeFilterValue)
    case "number-range":
      return matchesNumberRange(cell, value as NumberRangeFilterValue)
    default:
      return true
  }
}

export function applyFilters<T>(data: T[], columns: ColumnDef<T>[], filters: FilterValues): T[] {
  const active = columns.filter(
    (col) => col.filter && !isEmptyFilterValue(filters[col.id])
  )
  if (active.length === 0) return data

  return data.filter((row) =>
    active.every((col) => {
      const config = col.filter!
      const cell = getRowValue(row, config.accessor ?? col.accessor, col.id)
      return matchesColumnFilter(cell, config.type, filters[col.id] as ColumnFilterValue)
    })
  )
}

function compareValues(a: unknown, b: unknown, direction: "asc" | "desc"): number {
  const aNull = a == null || a === ""
  const bNull = b == null || b === ""
  if (aNull && bNull) return 0
  if (aNull) return 1
  if (bNull) return -1

  if (typeof a === "number" && typeof b === "number") {
    return direction === "asc" ? a - b : b - a
  }

  const aNum = typeof a === "number" ? a : Number(a)
  const bNum = typeof b === "number" ? b : Number(b)
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && String(a).trim() !== "" && String(b).trim() !== "") {
    const bothNumeric =
      (typeof a === "number" || /^-?\d+(\.\d+)?$/.test(String(a).trim())) &&
      (typeof b === "number" || /^-?\d+(\.\d+)?$/.test(String(b).trim()))
    if (bothNumeric) {
      return direction === "asc" ? aNum - bNum : bNum - aNum
    }
  }

  const aStr = String(a)
  const bStr = String(b)
  return direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
}

export function applySort<T>(data: T[], columns: ColumnDef<T>[], sort: SortState): T[] {
  if (!sort) return data

  const column = columns.find((col) => col.id === sort.id)
  if (!column) return data

  const sorted = [...data]
  sorted.sort((a, b) => {
    const aVal = getRowValue(a, column.accessor, column.id)
    const bVal = getRowValue(b, column.accessor, column.id)
    return compareValues(aVal, bVal, sort.direction)
  })
  return sorted
}

export function formatFilterValueLabel(
  type: NonNullable<ColumnDef<unknown>["filter"]>["type"],
  value: ColumnFilterValue,
  options?: { value: string; label: string }[]
): string {
  switch (type) {
    case "text":
      return String(value)
    case "select": {
      const raw = String(value)
      return options?.find((o) => o.value === raw)?.label ?? raw
    }
    case "date-range": {
      const range = value as DateRangeFilterValue
      if (range.from && range.to) return `${range.from} → ${range.to}`
      if (range.from) return `From ${range.from}`
      if (range.to) return `Until ${range.to}`
      return ""
    }
    case "number-range": {
      const range = value as NumberRangeFilterValue
      if (range.min != null && range.max != null) return `${range.min} – ${range.max}`
      if (range.min != null) return `≥ ${range.min}`
      if (range.max != null) return `≤ ${range.max}`
      return ""
    }
    default:
      return String(value)
  }
}

export function areSortsEqual(a: SortState, b: SortState): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a.id === b.id && a.direction === b.direction
}
