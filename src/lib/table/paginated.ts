import type { AxiosResponse } from "axios"

export type PaginatedList<T> = {
  items: T[]
  total: number
}

/** Default page size for primary list tables (server or client). */
export const TABLE_PAGE_SIZE = 10

/**
 * Cap used when a list must still be filtered entirely on the client
 * (e.g. computed columns with no API support). Prefer server paging when possible.
 */
export const CLIENT_FETCH_CAP = 500

/**
 * Read a list total from `X-Total-Count`, an explicit body total, or the item count.
 */
export function readTotalCount(
  response: Pick<AxiosResponse, "headers" | "data">,
  options?: {
    bodyTotal?: number
    itemsLength?: number
  }
): number {
  const headerRaw =
    response.headers?.["x-total-count"] ?? response.headers?.["X-Total-Count"]
  if (headerRaw != null && headerRaw !== "") {
    const parsed = Number(headerRaw)
    if (!Number.isNaN(parsed) && parsed >= 0) return parsed
  }

  if (typeof options?.bodyTotal === "number" && options.bodyTotal >= 0) {
    return options.bodyTotal
  }

  if (typeof options?.itemsLength === "number") return options.itemsLength

  if (Array.isArray(response.data)) return response.data.length

  return 0
}

export function toPaginatedList<T>(
  items: T[],
  total: number
): PaginatedList<T> {
  return { items, total: Math.max(total, items.length) }
}

/**
 * Normalize React Query cache values that may be either a bare array or a
 * PaginatedList (same query keys are shared across list pages and enrichers).
 */
export function asListItems<T>(
  data: PaginatedList<T> | T[] | null | undefined
): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray((data as PaginatedList<T>).items)) {
    return (data as PaginatedList<T>).items
  }
  return []
}
