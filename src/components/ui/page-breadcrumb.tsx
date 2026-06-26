import React from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  to?: string
}

export interface PageBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav
      className={cn(
        "flex w-fit flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs text-muted-foreground",
        className
      )}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />}
          {item.to ? (
            <Link
              to={item.to}
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              {index === 0 && <Home className="h-3.5 w-3.5" aria-hidden />}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
