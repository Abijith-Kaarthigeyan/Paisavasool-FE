import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useBrokenPromises, usePromises } from "../hooks/useCollections"
import type { CollectionCase, PaymentPromise } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { FilterBar } from "@/components/ui/filter-bar"
import { ActiveFilterChips } from "@/components/ui/active-filter-chips"
import { MobileColumnFilters } from "@/components/ui/mobile-column-filters"
import { SortableHeader } from "@/components/ui/sortable-header"
import { TableListEmpty } from "@/components/ui/table-list-empty"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { COLLECTION_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import {
  CLIENT_FETCH_CAP,
  TABLE_PAGE_SIZE,
  useClientTable,
  useTableUrlState,
  type ColumnDef,
} from "@/lib/table"
import { AlertCircle, HeartOff, RefreshCw } from "lucide-react"

type BrokenCaseRow = CollectionCase & {
  brokenPromise?: PaymentPromise
  daysOverdue: number
}

const INITIAL_SORT = { id: "daysOverdue", direction: "desc" as const }
const URL_EXTRA_KEYS = ["q"] as const

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "PROMISED", label: "Promised" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "DISPUTED", label: "Disputed" },
  { value: "CLOSED", label: "Closed" },
]

export const BrokenPromisesPage: React.FC = () => {
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState("")

  const {
    data: cases = [],
    isLoading: isLoadingCases,
    isError: isCasesError,
    refetch: refetchCases,
  } = useBrokenPromises({ limit: CLIENT_FETCH_CAP })
  const {
    data: promises = [],
    isLoading: isLoadingPromises,
    isError: isPromisesError,
    refetch: refetchPromises,
  } = usePromises()

  const handleRetry = () => {
    refetchCases()
    refetchPromises()
  }

  const isLoading = isLoadingCases || isLoadingPromises
  const isError = isCasesError || isPromisesError

  const enrichedBrokenCases = useMemo<BrokenCaseRow[]>(() => {
    if (!cases.length) return []

    const brokenPromisesMap = new Map(
      promises.filter((p) => p.status === "BROKEN").map((p) => [p.collection_case_id, p])
    )

    return cases.map((c) => {
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
  }, [cases, promises])

  const toolbarFiltered = useMemo(() => {
    if (!searchTerm.trim()) return enrichedBrokenCases
    const term = searchTerm.toLowerCase()
    return enrichedBrokenCases.filter(
      (c) =>
        (c.customer?.customer_name || "").toLowerCase().includes(term) ||
        (c.invoice?.invoice_number || "").toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
    )
  }, [enrichedBrokenCases, searchTerm])

  const columns = useMemo<ColumnDef<BrokenCaseRow>[]>(
    () => [
      {
        id: "customer_name",
        label: "Customer",
        sortable: true,
        accessor: (row) => row.customer?.customer_name ?? "Active account",
        filter: { type: "text", placeholder: "Customer…" },
      },
      {
        id: "invoice_number",
        label: "Invoice",
        sortable: true,
        accessor: (row) => row.invoice?.invoice_number ?? "INV-N/A",
        filter: { type: "text", placeholder: "Invoice…" },
      },
      {
        id: "outstanding_amount",
        label: "Outstanding",
        sortable: true,
        align: "right",
        defaultSortDirection: "desc",
        accessor: (row) => row.invoice?.outstanding_amount ?? row.outstanding_amount_snapshot,
        filter: { type: "number-range" },
      },
      {
        id: "promise_date",
        label: "Promise date",
        sortable: true,
        align: "center",
        accessor: (row) => row.brokenPromise?.promised_date ?? "",
        filter: { type: "date-range" },
      },
      {
        id: "daysOverdue",
        label: "Days overdue",
        sortable: true,
        align: "center",
        defaultSortDirection: "desc",
        filter: { type: "number-range" },
      },
      {
        id: "assigned_associate_name",
        label: "Assigned associate",
        sortable: true,
        accessor: (row) => row.assigned_associate_name ?? "",
        filter: { type: "text", placeholder: "Associate…" },
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        align: "center",
        filter: { type: "select", options: STATUS_OPTIONS },
      },
    ],
    []
  )

  const table = useClientTable({
    data: toolbarFiltered,
    columns,
    initialSort: INITIAL_SORT,
    pageSize: TABLE_PAGE_SIZE,
  })

  const urlExtras = useMemo(
    () => ({
      q: searchTerm || undefined,
    }),
    [searchTerm]
  )

  useTableUrlState({
    columns,
    sort: table.sort,
    filters: table.filters,
    page: table.page,
    setSort: table.setSort,
    setFilter: table.setFilter,
    setPage: table.setPage,
    replaceFilters: table.replaceFilters,
    extras: urlExtras,
    extraKeys: [...URL_EXTRA_KEYS],
    onExtrasChange: (extras) => {
      if (extras.q != null) setSearchTerm(extras.q)
    },
    defaultSort: INITIAL_SORT,
  })

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

  const hasActiveFilters = !!searchTerm || table.hasNonDefaultState

  const clearFilters = () => {
    setSearchTerm("")
    table.clearAll()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageBreadcrumb
        items={[
          { label: "Collections", to: "/collections" },
          { label: "Broken commitments" },
        ]}
      />

      <PageHeader
        title="Broken commitments"
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

      <Card className="border-t-2 border-t-destructive/40">
        <div className="space-y-2 border-b border-border p-3">
          <FilterBar
            variant="toolbar"
            size="sm"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by customer name or invoice number…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
          >
            <MobileColumnFilters
              columns={columns}
              filters={table.filters}
              onFilterChange={table.setFilter}
            />
          </FilterBar>

          <ActiveFilterChips
            chips={table.activeChips}
            onRemove={table.clearFilter}
          />
        </div>
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
          ) : (
            <TableListEmpty
              sourceCount={enrichedBrokenCases.length}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No broken promises"
              emptyDescription="No active collection cases have broken promises."
              emptyIcon={<HeartOff className="h-6 w-6 text-muted-foreground" />}
              noMatchesTitle="No broken promises found"
              noMatchesDescription="No broken promises match the current filters."
              onClearFilters={clearFilters}
            />
          )}
          {!isLoading && !isError && table.filteredRows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <SortableHeader
                      key={column.id}
                      column={column}
                      sort={table.sort}
                      onSort={table.cycleSort}
                      filterValue={table.filters[column.id]}
                      onFilterChange={table.setFilter}
                    />
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((c) => {
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

      {!isLoading && !isError && table.totalPages > 1 && (
        <Pagination
          currentPage={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          totalItems={table.total}
          pageSize={table.pageSize}
        />
      )}
    </div>
  )
}

export default BrokenPromisesPage
