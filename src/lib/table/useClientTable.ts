import { useCallback, useEffect, useMemo, useState } from "react"
import {
  applyFilters,
  applySort,
  areSortsEqual,
  formatFilterValueLabel,
  isEmptyFilterValue,
} from "./applyFilters"
import type {
  ActiveFilterChip,
  ColumnDef,
  ColumnFilterValue,
  FilterValues,
  SortDirection,
  SortState,
} from "./types"

export type TablePaginationMode = "client" | "server"

export interface UseClientTableOptions<T> {
  data: T[]
  columns: ColumnDef<T>[]
  initialSort?: SortState
  initialFilters?: FilterValues
  initialPage?: number
  pageSize?: number
  /** When true, reset page to 1 whenever filters/sort change (default true). */
  resetPageOnChange?: boolean
  /**
   * `client` (default): filter → sort → slice locally.
   * `server`: data is already one page; pagination totals come from `serverTotal`.
   * When using `server` mode with column filters, prefer `useTableQueryBridge`
   * so active filters switch to a capped full fetch + client pagination.
   * Otherwise filters only see the current page and totals stay wrong.
   */
  paginationMode?: TablePaginationMode
  /** Required when paginationMode is `server`. */
  serverTotal?: number
  /** Controlled page (1-based). When set with onPageChange, page is controlled. */
  page?: number
  onPageChange?: (page: number) => void
}

export interface UseClientTableResult<T> {
  rows: T[]
  /** Filtered + sorted rows before pagination (server mode: current page after client filters). */
  filteredRows: T[]
  sort: SortState
  setSort: (sort: SortState) => void
  cycleSort: (columnId: string) => void
  filters: FilterValues
  setFilter: (columnId: string, value: ColumnFilterValue | undefined) => void
  clearFilter: (columnId: string) => void
  replaceFilters: (filters: FilterValues) => void
  clearAll: () => void
  page: number
  setPage: (page: number) => void
  pageSize: number
  total: number
  totalPages: number
  hasActiveFilters: boolean
  hasActiveSort: boolean
  hasNonDefaultState: boolean
  activeChips: ActiveFilterChip[]
  paginationMode: TablePaginationMode
}

export function useClientTable<T>({
  data,
  columns,
  initialSort = null,
  initialFilters = {},
  initialPage = 1,
  pageSize = 10,
  resetPageOnChange = true,
  paginationMode = "client",
  serverTotal = 0,
  page: controlledPage,
  onPageChange,
}: UseClientTableOptions<T>): UseClientTableResult<T> {
  const isPageControlled = controlledPage !== undefined && !!onPageChange

  const [sort, setSortState] = useState<SortState>(initialSort)
  const [filters, setFilters] = useState<FilterValues>(initialFilters)
  const [uncontrolledPage, setUncontrolledPage] = useState(initialPage)

  const page = isPageControlled ? controlledPage! : uncontrolledPage

  const setPage = useCallback(
    (next: number) => {
      const safe = Math.max(1, next)
      if (isPageControlled) onPageChange!(safe)
      else setUncontrolledPage(safe)
    },
    [isPageControlled, onPageChange]
  )

  const resetPage = useCallback(() => {
    if (resetPageOnChange) setPage(1)
  }, [resetPageOnChange, setPage])

  const setSort = useCallback(
    (next: SortState) => {
      setSortState(next)
      resetPage()
    },
    [resetPage]
  )

  const cycleSort = useCallback(
    (columnId: string) => {
      const column = columns.find((col) => col.id === columnId)
      if (!column?.sortable) return

      const firstDirection: SortDirection = column.defaultSortDirection ?? "asc"

      setSortState((current) => {
        if (!current || current.id !== columnId) {
          return { id: columnId, direction: firstDirection }
        }
        if (current.direction === firstDirection) {
          const flipped: SortDirection = firstDirection === "asc" ? "desc" : "asc"
          return { id: columnId, direction: flipped }
        }
        return initialSort
      })
      resetPage()
    },
    [columns, initialSort, resetPage]
  )

  const setFilter = useCallback(
    (columnId: string, value: ColumnFilterValue | undefined) => {
      setFilters((prev) => {
        const next = { ...prev }
        if (isEmptyFilterValue(value)) {
          delete next[columnId]
        } else {
          next[columnId] = value
        }
        return next
      })
      resetPage()
    },
    [resetPage]
  )

  const clearFilter = useCallback(
    (columnId: string) => {
      setFilters((prev) => {
        if (!(columnId in prev)) return prev
        const next = { ...prev }
        delete next[columnId]
        return next
      })
      resetPage()
    },
    [resetPage]
  )

  const replaceFilters = useCallback(
    (next: FilterValues) => {
      let changed = true
      setFilters((prev) => {
        const prevKeys = Object.keys(prev).filter((k) => !isEmptyFilterValue(prev[k]))
        const nextKeys = Object.keys(next).filter((k) => !isEmptyFilterValue(next[k]))
        const same =
          prevKeys.length === nextKeys.length &&
          prevKeys.every((key) => JSON.stringify(prev[key]) === JSON.stringify(next[key]))
        if (same) {
          changed = false
          return prev
        }
        return next
      })
      if (changed) resetPage()
    },
    [resetPage]
  )

  const clearAll = useCallback(() => {
    setFilters({})
    setSortState(initialSort)
    setPage(1)
  }, [initialSort, setPage])

  const filteredRows = useMemo(() => {
    const filtered = applyFilters(data, columns, filters)
    // Server already sorted when paginationMode is server; still allow client sort
    // as a fallback when sort state exists (e.g. computed columns).
    return applySort(filtered, columns, sort)
  }, [data, columns, filters, sort])

  // Server mode: pagination is driven by the API total. Client filters only
  // narrow the current page's visible rows (filteredRows / rows).
  const total =
    paginationMode === "server" ? Math.max(0, serverTotal) : filteredRows.length

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage, setPage])

  const rows = useMemo(() => {
    if (paginationMode === "server") {
      return filteredRows
    }
    const start = (safePage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, safePage, pageSize, paginationMode])

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => !isEmptyFilterValue(value)),
    [filters]
  )

  const hasActiveSort = !areSortsEqual(sort, initialSort)

  const hasNonDefaultState = hasActiveFilters || hasActiveSort

  const activeChips = useMemo<ActiveFilterChip[]>(() => {
    return columns
      .filter((col) => col.filter && !isEmptyFilterValue(filters[col.id]))
      .map((col) => {
        const value = filters[col.id] as ColumnFilterValue
        return {
          id: col.id,
          label: col.label,
          valueLabel: formatFilterValueLabel(col.filter!.type, value, col.filter!.options),
        }
      })
  }, [columns, filters])

  return {
    rows,
    filteredRows,
    sort,
    setSort,
    cycleSort,
    filters,
    setFilter,
    clearFilter,
    replaceFilters,
    clearAll,
    page: safePage,
    setPage,
    pageSize,
    total,
    totalPages,
    hasActiveFilters,
    hasActiveSort,
    hasNonDefaultState,
    activeChips,
    paginationMode,
  }
}
