import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePaymentUploads } from "../hooks/usePayments"
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
import { getDashboardPath } from "@/lib/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PAYMENT_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import { CLIENT_FETCH_CAP, TABLE_PAGE_SIZE, useClientTable, type ColumnDef } from "@/lib/table"
import { TableListEmpty } from "@/components/ui/table-list-empty"
import { RefreshCw, HelpCircle, Inbox } from "lucide-react"
import { PaymentUploadResponse } from "../types"

const STATUS_OPTIONS = [
  { value: "UPLOADED", label: "Uploaded" },
  { value: "PROCESSING", label: "Processing" },
  { value: "MATCHED", label: "Matched" },
  { value: "REVIEW_REQUIRED", label: "Review required" },
  { value: "FAILED", label: "Failed" },
]

const INITIAL_SORT = { id: "uploaded_at", direction: "desc" as const }

export const PaymentUploadHistoryPage: React.FC = () => {
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebouncedValue(searchTerm)

  const listParams = useMemo(
    () => ({
      limit: CLIENT_FETCH_CAP,
      offset: 0,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [debouncedSearch]
  )

  const {
    data: uploadsData,
    isLoading,
    isError,
    refetch,
  } = usePaymentUploads(listParams, {
    refetchInterval: 10000,
  })

  const uploads = (uploadsData || []) as PaymentUploadResponse[]

  const handleRowClick = (uploadId: string) => {
    navigate(`/payment-upload/${uploadId}`)
  }

  const columns = useMemo<ColumnDef<PaymentUploadResponse>[]>(
    () => [
      {
        id: "file_name",
        label: "File name",
        sortable: true,
        filter: { type: "text", placeholder: "File name…" },
      },
      {
        id: "uploaded_at",
        label: "Uploaded at",
        sortable: true,
        defaultSortDirection: "desc",
        filter: { type: "date-range" },
      },
      {
        id: "uploaded_by",
        label: "Uploaded by",
        sortable: true,
        filter: { type: "text", placeholder: "Uploader…" },
      },
      {
        id: "status",
        label: "Ingestion status",
        sortable: true,
        align: "right",
        filter: { type: "select", options: STATUS_OPTIONS },
      },
    ],
    []
  )

  const table = useClientTable({
    data: uploads,
    columns,
    initialSort: INITIAL_SORT,
    pageSize: TABLE_PAGE_SIZE,
  })

  const hasToolbarFilters = !!searchTerm
  const hasActiveFilters = hasToolbarFilters || table.hasNonDefaultState

  const clearFilters = () => {
    setSearchTerm("")
    table.clearAll()
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Payment history" },
        ]}
      />

      <PageHeader
        title="Payment upload history"
        meta="Auto-refresh enabled"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh list
          </Button>
        }
      />

      <Card>
        <div className="space-y-2 border-b border-border p-3">
          <FilterBar
            variant="toolbar"
            size="sm"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by file name or uploader…"
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
            <div className="p-4">
              <TableSkeleton rows={6} columns={4} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load history"
              description="Unable to retrieve the list of payment uploads. Please check the backend connectivity."
              action={
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Try again
                </Button>
              }
            />
          ) : (
            <TableListEmpty
              sourceCount={uploads.length}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No payment uploads yet"
              emptyDescription="No payment documents have been uploaded yet."
              emptyIcon={<Inbox className="h-6 w-6" />}
              noMatchesTitle="No uploads found"
              noMatchesDescription="No payment uploads match the current filters."
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
                {table.rows.map((pay) => (
                  <TableRow
                    key={pay.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(pay.id)}
                  >
                    <TableCell
                      className="max-w-[280px] truncate font-medium text-foreground"
                      title={pay.file_name}
                    >
                      {pay.file_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(pay.uploaded_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{pay.uploaded_by}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={getStatusVariant(PAYMENT_STATUS_VARIANT, pay.status)}
                        shape="pill"
                      >
                        {pay.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && !isError && table.filteredRows.length > 0 && table.totalPages > 1 && (
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

export default PaymentUploadHistoryPage
