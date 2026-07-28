import { isEmptyFilterValue } from "./applyFilters"
import type {
  ColumnDef,
  ColumnFilterValue,
  DateRangeFilterValue,
  FilterValues,
  NumberRangeFilterValue,
  SortState,
} from "./types"

export type TableUrlState = {
  sort: SortState
  filters: FilterValues
  page: number
  extras: Record<string, string>
}

export type ParseTableUrlOptions<T> = {
  columns: ColumnDef<T>[]
  /** Query keys for toolbar / non-column params (e.g. status, customer). */
  extraKeys?: string[]
  defaultSort?: SortState
  defaultPage?: number
}

const SORT_KEY = "sort"
const PAGE_KEY = "page"
const FILTER_PREFIX = "f_"

function encodeFilterValue(
  type: NonNullable<ColumnDef<unknown>["filter"]>["type"],
  value: ColumnFilterValue
): string {
  switch (type) {
    case "text":
    case "select":
      return String(value)
    case "date-range": {
      const range = value as DateRangeFilterValue
      return `${range.from ?? ""},${range.to ?? ""}`
    }
    case "number-range": {
      const range = value as NumberRangeFilterValue
      const min = range.min == null ? "" : String(range.min)
      const max = range.max == null ? "" : String(range.max)
      return `${min},${max}`
    }
    default:
      return String(value)
  }
}

function decodeFilterValue(
  type: NonNullable<ColumnDef<unknown>["filter"]>["type"],
  raw: string
): ColumnFilterValue | undefined {
  if (!raw) return undefined

  switch (type) {
    case "text":
    case "select":
      return raw
    case "date-range": {
      const [from = "", to = ""] = raw.split(",")
      const value: DateRangeFilterValue = {
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }
      return isEmptyFilterValue(value) ? undefined : value
    }
    case "number-range": {
      const [minRaw = "", maxRaw = ""] = raw.split(",")
      const min = minRaw === "" ? undefined : Number(minRaw)
      const max = maxRaw === "" ? undefined : Number(maxRaw)
      const value: NumberRangeFilterValue = {
        ...(min != null && !Number.isNaN(min) ? { min } : {}),
        ...(max != null && !Number.isNaN(max) ? { max } : {}),
      }
      return isEmptyFilterValue(value) ? undefined : value
    }
    default:
      return raw
  }
}

export function parseSortParam(
  raw: string | null,
  defaultSort: SortState = null
): SortState {
  if (!raw) return defaultSort
  const [id, direction] = raw.split(":")
  if (!id || (direction !== "asc" && direction !== "desc")) return defaultSort
  return { id, direction }
}

export function serializeSortParam(sort: SortState, defaultSort: SortState = null): string | null {
  if (!sort) return null
  if (defaultSort && sort.id === defaultSort.id && sort.direction === defaultSort.direction) {
    return null
  }
  return `${sort.id}:${sort.direction}`
}

/**
 * Read table sort / column filters / page / extras from URLSearchParams.
 */
export function parseTableSearchParams<T>(
  params: URLSearchParams,
  options: ParseTableUrlOptions<T>
): TableUrlState {
  const defaultSort = options.defaultSort ?? null
  const defaultPage = options.defaultPage ?? 1

  const sort = parseSortParam(params.get(SORT_KEY), defaultSort)

  const filters: FilterValues = {}
  for (const column of options.columns) {
    if (!column.filter) continue
    const raw = params.get(`${FILTER_PREFIX}${column.id}`)
    if (raw == null) continue
    const decoded = decodeFilterValue(column.filter.type, raw)
    if (decoded !== undefined) filters[column.id] = decoded
  }

  const pageRaw = params.get(PAGE_KEY)
  const pageParsed = pageRaw ? Number(pageRaw) : defaultPage
  const page =
    Number.isFinite(pageParsed) && pageParsed >= 1 ? Math.floor(pageParsed) : defaultPage

  const extras: Record<string, string> = {}
  for (const key of options.extraKeys ?? []) {
    const value = params.get(key)
    if (value) extras[key] = value
  }

  return { sort, filters, page, extras }
}

export type SerializeTableUrlOptions<T> = {
  columns: ColumnDef<T>[]
  sort: SortState
  filters: FilterValues
  page: number
  extras?: Record<string, string | undefined>
  defaultSort?: SortState
  defaultPage?: number
  /** Keys to preserve from the current URL that this serializer does not own. */
  preserveKeys?: string[]
  currentParams?: URLSearchParams
}

/**
 * Build URLSearchParams for table state. Omits defaults to keep URLs short.
 */
export function serializeTableSearchParams<T>(
  options: SerializeTableUrlOptions<T>
): URLSearchParams {
  const next = new URLSearchParams()
  const defaultSort = options.defaultSort ?? null
  const defaultPage = options.defaultPage ?? 1

  if (options.currentParams && options.preserveKeys?.length) {
    for (const key of options.preserveKeys) {
      const value = options.currentParams.get(key)
      if (value) next.set(key, value)
    }
  }

  const sortParam = serializeSortParam(options.sort, defaultSort)
  if (sortParam) next.set(SORT_KEY, sortParam)

  for (const column of options.columns) {
    if (!column.filter) continue
    const value = options.filters[column.id]
    if (isEmptyFilterValue(value)) continue
    next.set(
      `${FILTER_PREFIX}${column.id}`,
      encodeFilterValue(column.filter.type, value as ColumnFilterValue)
    )
  }

  if (options.page > defaultPage) {
    next.set(PAGE_KEY, String(options.page))
  }

  for (const [key, value] of Object.entries(options.extras ?? {})) {
    if (value) next.set(key, value)
  }

  return next
}

export function tableSearchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  if (a.toString() === b.toString()) return true
  const keys = new Set([...a.keys(), ...b.keys()])
  for (const key of keys) {
    if (a.get(key) !== b.get(key)) return false
  }
  return true
}
