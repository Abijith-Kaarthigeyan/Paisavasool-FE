import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useBrokenPromises, usePromises } from "../hooks/useCollections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { FilterBar } from "@/components/ui/filter-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { COLLECTION_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { AlertCircle, HeartOff, RefreshCw } from "lucide-react"

export const BrokenPromisesPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    data: cases = [],
    isLoading: isLoadingCases,
    isError: isCasesError,
    refetch: refetchCases,
  } = useBrokenPromises()
  const {
    data: promises = [],
    isLoading: isLoadingPromises,
    isError: isPromisesError,
    refetch: refetchPromises,
  } = usePromises()

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleRetry = () => {
    refetchCases()
    refetchPromises()
  }

  const isLoading = isLoadingCases || isLoadingPromises
  const isError = isCasesError || isPromisesError

  const enrichedBrokenCases = useMemo(() => {
    if (!cases.length) return []

    const brokenPromisesMap = new Map(
      promises.filter((p) => p.status === "BROKEN").map((p) => [p.collection_case_id, p])
    )

    return cases
      .map((c) => {
        const activeBrokenPromise = brokenPromisesMap.get(c.id)

        let daysOverdue = 0
        if (activeBrokenPromise?.promised_date) {
          const promiseTime = new Date(activeBrokenPromise.promised_date).getTime()
          const diffTime = Date.now() - promiseTime
          daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
        }

        return {
          ...c,
          brokenPromise: activeBrokenPromise,
          daysOverdue,
        }
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
  }, [cases, promises])

  const filteredCases = useMemo(() => {
    return enrichedBrokenCases.filter((c) => {
      const term = searchTerm.toLowerCase()
      return (
        (c.customer?.customer_name || "").toLowerCase().includes(term) ||
        (c.invoice?.invoice_number || "").toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
      )
    })
  }, [enrichedBrokenCases, searchTerm])

  const totalItems = filteredCases.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage)

  const avgOverdueDays =
    enrichedBrokenCases.length > 0
      ? (
          enrichedBrokenCases.reduce((sum, c) => sum + c.daysOverdue, 0) /
          enrichedBrokenCases.length
        ).toFixed(1)
      : "0.0"

  const outstandingAtRisk = enrichedBrokenCases.reduce(
    (sum, c) => sum + (c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot),
    0
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Broken commitments"
        description="Track collection cases where customers breached payment promise dates."
        actions={
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh list
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Total breached promises"
          value={`${isLoading ? "…" : enrichedBrokenCases.length} cases`}
          icon={<HeartOff className="h-5 w-5" />}
          iconTone="destructive"
          loading={isLoading}
        />
        <KpiCard
          label="Average overdue days"
          value={`${isLoading ? "…" : avgOverdueDays} days`}
          icon={<AlertCircle className="h-5 w-5" />}
          iconTone="warning"
          loading={isLoading}
        />
        <KpiCard
          label="Outstanding at risk"
          value={
            isLoading
              ? "…"
              : `₹${outstandingAtRisk.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          }
          icon={<RefreshCw className="h-5 w-5" />}
          iconTone="default"
          loading={isLoading}
        />
      </KpiGrid>

      <Card>
        <CardContent className="p-4">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value)
              setCurrentPage(1)
            }}
            searchPlaceholder="Search by customer name or invoice number…"
            showClear={!!searchTerm}
            onClear={() => {
              setSearchTerm("")
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-t-2 border-t-destructive/40">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : isError ? (
            <EmptyState
              icon={<AlertCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load broken commitments"
              description="An error occurred while fetching the broken promises registry."
              action={
                <Button size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              }
            />
          ) : paginatedCases.length === 0 ? (
            <EmptyState
              icon={<HeartOff className="h-6 w-6 text-muted-foreground" />}
              title="No broken promises"
              description="No active collection cases have broken promises."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-center">Promise date</TableHead>
                  <TableHead className="text-center">Days overdue</TableHead>
                  <TableHead>Assigned associate</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCases.map((c) => {
                  const outstanding =
                    c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/collections/${c.id}`)}
                    >
                      <TableCell className="font-medium">
                        {c.customer?.customer_name || "Active account"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.invoice?.invoice_number || "INV-N/A"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-destructive">
                        {c.brokenPromise?.promised_date
                          ? new Date(c.brokenPromise.promised_date).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive" shape="pill">
                          {c.daysOverdue} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.assigned_associate_name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusVariant(COLLECTION_STATUS_VARIANT, c.status)}
                          shape="pill"
                        >
                          {c.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={itemsPerPage}
        />
      )}
    </div>
  )
}

export default BrokenPromisesPage
