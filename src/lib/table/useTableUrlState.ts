import { useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { areSortsEqual, isEmptyFilterValue } from "./applyFilters"
import type { ColumnDef, FilterValues, SortState } from "./types"
import {
  parseTableSearchParams,
  serializeTableSearchParams,
  tableSearchParamsEqual,
  type TableUrlState,
} from "./urlState"

export type UseTableUrlStateOptions<T> = {
  columns: ColumnDef<T>[]
  sort: SortState
  filters: FilterValues
  page: number
  setSort: (sort: SortState) => void
  setFilter: (columnId: string, value: FilterValues[string]) => void
  setPage: (page: number) => void
  /** Replace all column filters (used when hydrating from URL). */
  replaceFilters?: (filters: FilterValues) => void
  extras?: Record<string, string | undefined>
  onExtrasChange?: (extras: Record<string, string>) => void
  extraKeys?: string[]
  /** Keys owned elsewhere that must survive table writes (e.g. deep-link `sla`). */
  preserveKeys?: string[]
  defaultSort?: SortState
  defaultPage?: number
  enabled?: boolean
}

function filtersEqual(a: FilterValues, b: FilterValues): boolean {
  const aKeys = Object.keys(a).filter((k) => !isEmptyFilterValue(a[k]))
  const bKeys = Object.keys(b).filter((k) => !isEmptyFilterValue(b[k]))
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((key) => JSON.stringify(a[key]) === JSON.stringify(b[key]))
}

function extrasEqual(
  a: Record<string, string>,
  b: Record<string, string | undefined>
): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b).filter((k) => b[k])
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((key) => a[key] === b[key])
}

/**
 * Two-way sync between useClientTable state (plus optional toolbar extras) and the URL.
 * Hydrates once from the URL on mount (only when URL differs from current state),
 * then writes back on state changes.
 */
export function useTableUrlState<T>({
  columns,
  sort,
  filters,
  page,
  setSort,
  setFilter,
  setPage,
  replaceFilters,
  extras = {},
  onExtrasChange,
  extraKeys = [],
  preserveKeys = [],
  defaultSort = null,
  defaultPage = 1,
  enabled = true,
}: UseTableUrlStateOptions<T>): TableUrlState {
  const [searchParams, setSearchParams] = useSearchParams()
  const hydratedRef = useRef(false)
  const skipNextWriteRef = useRef(false)

  const parsed = useMemo(
    () =>
      parseTableSearchParams(searchParams, {
        columns,
        extraKeys,
        defaultSort,
        defaultPage,
      }),
    [searchParams, columns, extraKeys, defaultSort, defaultPage]
  )

  // Hydrate table state from URL once — only apply setters when values differ
  // so empty URLs don't force a remount/refetch cycle after first paint.
  useEffect(() => {
    if (!enabled || hydratedRef.current) return
    hydratedRef.current = true

    let changed = false

    if (!areSortsEqual(parsed.sort, sort)) {
      setSort(parsed.sort)
      changed = true
    }
    if (parsed.page !== page) {
      setPage(parsed.page)
      changed = true
    }

    if (!filtersEqual(parsed.filters, filters)) {
      if (replaceFilters) {
        replaceFilters(parsed.filters)
      } else {
        for (const [columnId, value] of Object.entries(parsed.filters)) {
          setFilter(columnId, value)
        }
      }
      changed = true
    }

    if (onExtrasChange && !extrasEqual(parsed.extras, extras)) {
      onExtrasChange(parsed.extras)
      changed = true
    }

    // If we just applied URL state, the ensuing write effect would re-serialize
    // the same params — skip one write to avoid a searchParams churn loop.
    if (changed) skipNextWriteRef.current = true
    // Intentionally once on mount for the current URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // Write table state back to the URL.
  useEffect(() => {
    if (!enabled || !hydratedRef.current) return
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false
      return
    }

    const next = serializeTableSearchParams({
      columns,
      sort,
      filters,
      page,
      extras,
      defaultSort,
      defaultPage,
      preserveKeys,
      currentParams: searchParams,
    })

    if (!tableSearchParamsEqual(next, searchParams)) {
      setSearchParams(next, { replace: true })
    }
  }, [
    enabled,
    columns,
    sort,
    filters,
    page,
    extras,
    defaultSort,
    defaultPage,
    preserveKeys,
    searchParams,
    setSearchParams,
  ])

  return parsed
}
