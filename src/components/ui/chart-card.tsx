import React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

export interface ChartCardError {
  title?: string
  message?: string
  onRetry?: () => void
}

export interface ChartCardEmpty {
  title?: string
  description?: string
}

export interface ChartCardProps {
  title: string
  description?: string
  children?: React.ReactNode
  loading?: boolean
  error?: ChartCardError | boolean
  empty?: ChartCardEmpty | boolean
  height?: string
  headerAction?: React.ReactNode
  className?: string
}

export function ChartCard({
  title,
  description,
  children,
  loading = false,
  error,
  empty,
  height = "h-44",
  headerAction,
  className,
}: ChartCardProps) {
  const isError = Boolean(error)
  const isEmpty = Boolean(empty) && !loading && !isError

  const errorConfig: ChartCardError =
    typeof error === "object" ? error : { title: "Failed to load chart" }

  const emptyConfig: ChartCardEmpty =
    typeof empty === "object"
      ? empty
      : { title: "No data yet", description: "Data will appear here once available." }

  return (
    <Card className={cn("border-border", className)}>
      <CardHeader className="mb-3 flex flex-row items-start justify-between space-y-0 border-b border-border pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {headerAction}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className={cn("w-full", height)} />
        ) : isError ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 px-4 text-center",
              height
            )}
          >
            <AlertCircle className="mb-2 h-8 w-8 text-destructive" aria-hidden />
            <p className="text-sm font-medium text-foreground">
              {errorConfig.title ?? "Failed to load chart"}
            </p>
            {errorConfig.message && (
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {errorConfig.message}
              </p>
            )}
            {errorConfig.onRetry && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={errorConfig.onRetry}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Retry
              </Button>
            )}
          </div>
        ) : isEmpty ? (
          <div className={cn("flex items-center justify-center", height)}>
            <EmptyState
              title={emptyConfig.title ?? "No data yet"}
              description={emptyConfig.description}
              className="py-4"
            />
          </div>
        ) : (
          <div className={cn("w-full", height)}>{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
