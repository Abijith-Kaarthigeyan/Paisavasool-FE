import React from "react"
import { Inbox, SearchX } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import {
  resolveTableEmptyState,
  type ResolveTableEmptyOptions,
} from "@/lib/table/emptyState"

export type TableListEmptyProps = Omit<
  ResolveTableEmptyOptions,
  "emptyTitle" | "emptyDescription" | "noMatchesTitle" | "noMatchesDescription"
> & {
  emptyTitle: string
  emptyDescription?: string
  noMatchesTitle?: string
  noMatchesDescription?: string
  emptyIcon?: React.ReactNode
  onClearFilters?: () => void
  clearLabel?: string
  className?: string
}

/**
 * Empty state that distinguishes “no data yet” from “filters hid everything”.
 */
export function TableListEmpty({
  sourceCount,
  filteredCount,
  hasActiveFilters,
  emptyTitle,
  emptyDescription,
  noMatchesTitle = "No results found",
  noMatchesDescription = "No rows match the current filters.",
  emptyIcon,
  onClearFilters,
  clearLabel = "Clear filters",
  className,
}: TableListEmptyProps) {
  const resolved = resolveTableEmptyState({
    sourceCount,
    filteredCount,
    hasActiveFilters,
    emptyTitle,
    emptyDescription,
    noMatchesTitle,
    noMatchesDescription,
  })

  if (!resolved) return null

  const isNoMatches = resolved.kind === "no-matches"

  return (
    <EmptyState
      className={className}
      icon={
        isNoMatches ? (
          <SearchX className="h-6 w-6" />
        ) : (
          (emptyIcon ?? <Inbox className="h-6 w-6" />)
        )
      }
      title={resolved.title}
      description={resolved.description}
      action={
        isNoMatches && onClearFilters ? (
          <Button type="button" variant="secondary" size="sm" onClick={onClearFilters}>
            {clearLabel}
          </Button>
        ) : undefined
      }
    />
  )
}
