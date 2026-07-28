import { useCallback, useLayoutEffect, useMemo, useState } from "react"
import { isEmptyFilterValue } from "./applyFilters"
import { CLIENT_FETCH_CAP, TABLE_PAGE_SIZE } from "./paginated"
import type { FilterValues, SortState } from "./types"
import type { TablePaginationMode } from "./useClientTable"

export type TableQueryBridgeOptions = {
  page: number
  pageSize?: number
  fetchCap?: number
  initialSort?: SortState
  /**
   * Force capped client paging for reasons outside column filters
   * (e.g. toolbar filters that only run on the client).
   */
  forceClientOnly?: boolean
}

export type TableQueryBridge = {
  sortOverride: SortState
  columnFilters: FilterValues
  hasColumnFilters: boolean
  clientOnlyPaging: boolean
  limit: number
  offset: number
  paginationMode: TablePaginationMode
  syncFromTable: (table: { sort: SortState; filters: FilterValues }) => void
}

/**
 * Bridges useClientTable column state into list-query paging.
 *
 * Server-paginated tables only receive one page of rows. Column filters applied
 * only on that page produce empty results while pagination still shows the
 * unfiltered total. When any column filter is active (or `forceClientOnly`),
 * this bridge switches to a capped full fetch + client pagination so filters
 * apply across the dataset.
 */
export function useTableQueryBridge({
  page,
  pageSize = TABLE_PAGE_SIZE,
  fetchCap = CLIENT_FETCH_CAP,
  initialSort = null,
  forceClientOnly = false,
}: TableQueryBridgeOptions): TableQueryBridge {
  const [sortOverride, setSortOverride] = useState<SortState>(initialSort)
  const [columnFilters, setColumnFilters] = useState<FilterValues>({})

  const syncFromTable = useCallback(
    (table: { sort: SortState; filters: FilterValues }) => {
      setSortOverride((prev) =>
        prev?.id === table.sort?.id && prev?.direction === table.sort?.direction
          ? prev
          : table.sort
      )
      setColumnFilters((prev) =>
        JSON.stringify(prev) === JSON.stringify(table.filters) ? prev : table.filters
      )
    },
    []
  )

  const hasColumnFilters = useMemo(
    () => Object.values(columnFilters).some((value) => !isEmptyFilterValue(value)),
    [columnFilters]
  )

  const clientOnlyPaging = forceClientOnly || hasColumnFilters

  return {
    sortOverride,
    columnFilters,
    hasColumnFilters,
    clientOnlyPaging,
    limit: clientOnlyPaging ? fetchCap : pageSize,
    offset: clientOnlyPaging ? 0 : (page - 1) * pageSize,
    paginationMode: clientOnlyPaging ? "client" : "server",
    syncFromTable,
  }
}

/**
 * Keep bridge mirrors in sync with useClientTable.
 * Syncs during render (not in an effect) so filter changes update list
 * `limit`/`offset` in the same turn — avoiding one paint of stale page rows.
 */
export function useSyncTableQueryBridge(
  bridge: Pick<TableQueryBridge, "syncFromTable">,
  table: { sort: SortState; filters: FilterValues }
): void {
  const { syncFromTable } = bridge
  const filtersKey = JSON.stringify(table.filters)
  const sortKey = `${table.sort?.id ?? ""}:${table.sort?.direction ?? ""}`
  const [syncedKeys, setSyncedKeys] = useState({ filtersKey, sortKey })

  if (syncedKeys.filtersKey !== filtersKey || syncedKeys.sortKey !== sortKey) {
    setSyncedKeys({ filtersKey, sortKey })
    syncFromTable(table)
  }

  // Still sync on mount in case the table hydrates filters from the URL after
  // the first paint of an empty filter state.
  useLayoutEffect(() => {
    syncFromTable(table)
  }, [syncFromTable, table.sort, table.filters])
}

export type ShouldShowTableLoadingOptions = {
  isLoading: boolean
  isFetching?: boolean
  /**
   * True while React Query is showing keepPreviousData for a new query key.
   * Required to hide stale page rows while a filter-driven refetch is in flight.
   */
  isPlaceholderData?: boolean
  /** Capped client-filter mode (column filters / client-only toolbar filters). */
  clientOnlyPaging?: boolean
  /** Any toolbar or column filter that makes the cached page untrustworthy. */
  hasActiveFilters?: boolean
  /** Current cached row count (placeholder or real). */
  cachedItemCount?: number
  pageSize?: number
}

/**
 * Decide whether to show the table skeleton instead of rows.
 *
 * keepPreviousData intentionally keeps the previous page visible during normal
 * page flips. That same cache is wrong when filters change: the UI would briefly
 * show only matches from the old page, then jump to the real filtered set.
 * While a filter-driven (or oversized-cache) refetch is in flight, show loading.
 */
export function shouldShowTableLoading(
  options: ShouldShowTableLoadingOptions
): boolean {
  if (options.isLoading) return true

  const pageSize = options.pageSize ?? TABLE_PAGE_SIZE
  const filterMode = !!(options.hasActiveFilters || options.clientOnlyPaging)
  const oversizedCache =
    options.cachedItemCount != null && options.cachedItemCount > pageSize

  // Still holding a single server page while capped client filtering is required.
  if (
    options.clientOnlyPaging &&
    options.cachedItemCount != null &&
    options.cachedItemCount <= pageSize &&
    options.isFetching
  ) {
    return true
  }

  if (!options.isFetching || !options.isPlaceholderData) return false

  if (filterMode || oversizedCache) return true

  return false
}
