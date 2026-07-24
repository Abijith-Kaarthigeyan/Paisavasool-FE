import React, { useLayoutEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGrns } from "../hooks/useGrns"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { FilterBar } from "@/components/ui/filter-bar"
import { ActiveFilterChips } from "@/components/ui/active-filter-chips"
import { MobileColumnFilters } from "@/components/ui/mobile-column-filters"
import { SortableHeader } from "@/components/ui/sortable-header"
import { TableListEmpty } from "@/components/ui/table-list-empty"
import { getDashboardPath } from "@/lib/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import {
  TABLE_PAGE_SIZE,
  shouldShowTableLoading,
  useClientTable,
  useSyncTableQueryBridge,
  useTableQueryBridge,
  useTableUrlState,
  type ColumnDef,
  type DateRangeFilterValue,
} from "@/lib/table"
import { RefreshCw, HelpCircle, PackageCheck } from "lucide-react"
import { BillingsListToggle } from "@/features/invoices/components/BillingsListToggle"
import type { GoodsReceiptNote, GrnStatus } from "../types"

function grnStatusVariant(status: GrnStatus): "success" | "warning" | "destructive" | "outline" {
  if (status === "LINKED") return "success"
  if (status === "UNLINKED") return "warning"
  if (status === "FAILED") return "destructive"
  return "outline"
}

function truncateNotes(notes: string | null, maxLength = 60): string {
  if (!notes) return "—"
  const trimmed = notes.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}…`
}

const STATUS_OPTIONS = [
  { value: "LINKED", label: "Linked" },
  { value: "UNLINKED", label: "Unlinked" },
  { value: "FAILED", label: "Failed" },
]

const URL_EXTRA_KEYS = ["q"] as const

export const GrnListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchTerm)
  const bridge = useTableQueryBridge({ page })

  // Mirror grn_date column filter to API date params (optimization); bridge still
  // switches to client paging when any column filter is active.
  const [grnDateRange, setGrnDateRange] = useState<DateRangeFilterValue>()

  const listParams = useMemo(
    () => ({
      limit: bridge.limit,
      offset: bridge.offset,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(grnDateRange?.from ? { grn_date_from: grnDateRange.from } : {}),
      ...(grnDateRange?.to ? { grn_date_to: grnDateRange.to } : {}),
      ...(bridge.sortOverride
        ? {
            sort_by: bridge.sortOverride.id,
            sort_order: bridge.sortOverride.direction,
          }
        : {}),
    }),
    [
      bridge.limit,
      bridge.offset,
      bridge.sortOverride,
      debouncedSearch,
      grnDateRange,
    ]
  )

  const {
    data: grnPage,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = useGrns(listParams)

  const grns = grnPage?.items ?? []
  const serverTotal = grnPage?.total ?? 0

  const columns = useMemo<ColumnDef<GoodsReceiptNote>[]>(
    () => [
      {
        id: "grn_number",
        label: "GRN number",
        sortable: true,
        filter: { type: "text", placeholder: "GRN number…" },
      },
      {
        id: "grn_date",
        label: "GRN date",
        sortable: true,
        defaultSortDirection: "desc",
        filter: { type: "date-range" },
      },
      {
        id: "po_number",
        label: "PO number",
        sortable: true,
        accessor: (row) => row.po_number ?? "",
        filter: { type: "text", placeholder: "PO number…" },
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        align: "center",
        filter: { type: "select", options: STATUS_OPTIONS },
      },
      {
        id: "notes",
        label: "Notes",
        sortable: true,
        accessor: (row) => row.notes ?? "",
        filter: { type: "text", placeholder: "Notes…" },
      },
    ],
    []
  )

  const table = useClientTable({
    data: grns,
    columns,
    pageSize: TABLE_PAGE_SIZE,
    paginationMode: bridge.paginationMode,
    serverTotal,
    page,
    onPageChange: setPage,
  })

  useSyncTableQueryBridge(bridge, table)

  useLayoutEffect(() => {
    const nextGrnDate = table.filters["grn_date"] as DateRangeFilterValue | undefined
    setGrnDateRange((prev) =>
      JSON.stringify(prev ?? null) === JSON.stringify(nextGrnDate ?? null) ? prev : nextGrnDate
    )
  }, [table.filters])

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
  })

  const hasToolbarFilters = !!searchTerm
  const hasActiveFilters = hasToolbarFilters || table.hasNonDefaultState
  const showTableLoading = shouldShowTableLoading({
    isLoading,
    isFetching,
    isPlaceholderData,
    clientOnlyPaging: bridge.clientOnlyPaging,
    hasActiveFilters,
    cachedItemCount: grns.length,
    pageSize: TABLE_PAGE_SIZE,
  })

  const clearFilters = () => {
    setSearchTerm("")
    table.clearAll()
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Receivables", to: "/invoices" },
          { label: "GRNs" },
        ]}
      />

      <div className="space-y-3">
        <PageHeader
          title="Receivables"
          actions={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh list
            </Button>
          }
        />

        <BillingsListToggle active="grns" />
      </div>

      <Card>
        <div className="space-y-2 border-b border-border p-3">
          <FilterBar
            variant="toolbar"
            size="sm"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by GRN number or PO number…"
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
          {showTableLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} columns={5} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load goods receipt notes"
              description="Verify the Accounts Receivable database backend service is active and responsive."
              action={
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Retry fetch
                </Button>
              }
            />
          ) : (
            <TableListEmpty
              sourceCount={serverTotal}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No goods receipt notes yet"
              emptyDescription="No goods receipt notes have been registered yet."
              emptyIcon={<PackageCheck className="h-6 w-6" />}
              noMatchesTitle="No goods receipt notes found"
              noMatchesDescription="No goods receipt notes match the current filters."
              onClearFilters={clearFilters}
            />
          )}
          {!showTableLoading && !isError && table.filteredRows.length > 0 && (
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
                {table.rows.map((grn) => (
                  <TableRow
                    key={grn.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/grns/${grn.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {grn.grn_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(grn.grn_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {grn.po_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={grnStatusVariant(grn.status)} shape="pill">
                        {grn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-muted-foreground">
                      {truncateNotes(grn.notes)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!showTableLoading && !isError && table.totalPages > 1 && (
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

export default GrnListPage
