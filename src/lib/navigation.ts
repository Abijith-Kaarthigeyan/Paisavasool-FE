import type { Location } from "react-router-dom"

export const DASHBOARD_PATH = "/dashboard"

export function getDashboardPath(): string {
  return DASHBOARD_PATH
}

/** Restore the page the user was on before auth, or fall back to dashboard. */
export function getPostLoginPath(from: Location | undefined): string {
  if (from?.pathname && from.pathname !== "/login") {
    return `${from.pathname}${from.search}${from.hash}`
  }
  return getDashboardPath()
}
