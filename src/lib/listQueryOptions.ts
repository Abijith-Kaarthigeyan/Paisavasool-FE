import { keepPreviousData } from "@tanstack/react-query"

/**
 * Shared options for paginated list queries.
 * Keeps the previous page's data visible while params (sort/page/filters) change,
 * so list UIs don't flash a full-table skeleton after the first successful load.
 */
export const listQueryOptions = {
  placeholderData: keepPreviousData,
} as const
