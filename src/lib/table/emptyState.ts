export type TableEmptyKind = "empty" | "no-matches"

export type ResolveTableEmptyOptions = {
  /** Rows available before column/toolbar filtering (typically the fetched list). */
  sourceCount: number
  /** Rows after filters (useClientTable.total, or 0 when the current page is empty). */
  filteredCount: number
  hasActiveFilters: boolean
  emptyTitle: string
  emptyDescription?: string
  noMatchesTitle?: string
  noMatchesDescription?: string
}

export type ResolvedTableEmpty = {
  kind: TableEmptyKind
  title: string
  description?: string
}

/**
 * Distinguish a truly empty dataset from “filters hid everything”.
 */
export function resolveTableEmptyState(
  options: ResolveTableEmptyOptions
): ResolvedTableEmpty | null {
  if (options.filteredCount > 0) return null

  if (!options.hasActiveFilters && options.sourceCount === 0) {
    return {
      kind: "empty",
      title: options.emptyTitle,
      description: options.emptyDescription,
    }
  }

  return {
    kind: "no-matches",
    title: options.noMatchesTitle ?? "No results found",
    description:
      options.noMatchesDescription ?? "No rows match the current filters.",
  }
}
