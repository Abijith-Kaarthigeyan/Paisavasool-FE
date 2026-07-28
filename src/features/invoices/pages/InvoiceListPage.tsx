import React, { useLayoutEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useInvoices } from "../hooks/useInvoices"
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
import { INVOICE_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { formatCurrency } from "@/lib/formatCurrency"
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
  type NumberRangeFilterValue,
} from "@/lib/table"
import { RefreshCw, HelpCircle, Inbox } from "lucide-react"
import {
  InvoicePoLinkBadge,
  getPoLinkState,
} from "@/features/purchase-orders/components/InvoicePoLinkBadge"
import { BillingsListToggle } from "../components/BillingsListToggle"
import type { Invoice } from "../types"

const getDisplayStatus = (invoice: Invoice): string => {
  if (invoice.status !== "OVERDUE") {
    return invoice.status
  }
  return invoice.outstanding_amount >= invoice.total_amount
    ? "PENDING"
    : "PARTIALLY_PAID"
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
  { value: "DISPUTED", label: "Disputed" },
]

const PO_LINK_OPTIONS = [
  { value: "linked", label: "Linked" },
  { value: "awaiting_match", label: "Unlinked with PO #" },
  { value: "none", label: "No PO #" },
]

const URL_EXTRA_KEYS = ["q"] as const

export const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchTerm)
  const bridge = useTableQueryBridge({ page })

  // Mirror date/amount column filters to API params (optimization).
  const [invoiceDateRange, setInvoiceDateRange] = useState<DateRangeFilterValue>()
  const [dueDateRange, setDueDateRange] = useState<DateRangeFilterValue>()
  const [totalAmountRange, setTotalAmountRange] = useState<NumberRangeFilterValue>()
  const [outstandingAmountRange, setOutstandingAmountRange] =
    useState<NumberRangeFilterValue>()

  const listParams = useMemo(
    () => ({
      limit: bridge.limit,
      offset: bridge.offset,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(invoiceDateRange?.from ? { invoice_date_from: invoiceDateRange.from } : {}),
      ...(invoiceDateRange?.to ? { invoice_date_to: invoiceDateRange.to } : {}),
      ...(dueDateRange?.from ? { due_date_from: dueDateRange.from } : {}),
      ...(dueDateRange?.to ? { due_date_to: dueDateRange.to } : {}),
      ...(totalAmountRange?.min != null
        ? { total_amount_min: totalAmountRange.min }
        : {}),
      ...(totalAmountRange?.max != null
        ? { total_amount_max: totalAmountRange.max }
        : {}),
      ...(outstandingAmountRange?.min != null
        ? { outstanding_amount_min: outstandingAmountRange.min }
        : {}),
      ...(outstandingAmountRange?.max != null
        ? { outstanding_amount_max: outstandingAmountRange.max }
        : {}),
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
      invoiceDateRange,
      dueDateRange,
      totalAmountRange,
      outstandingAmountRange,
    ]
  )

  const {
    data: invoicePage,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = useInvoices(listParams)

  const invoices = invoicePage?.items ?? []
  const serverTotal = invoicePage?.total ?? 0

  const handleRowClick = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`)
  }

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        id: "invoice_number",
        label: "Invoice number",
        sortable: true,
        filter: { type: "text", placeholder: "Invoice number…" },
      },
      {
        id: "customer",
        label: "Customer",
        sortable: true,
        accessor: (row) => row.customer?.customer_name ?? "",
        filter: { type: "text", placeholder: "Customer name…" },
      },
      {
        id: "invoice_date",
        label: "Invoice date",
        sortable: true,
        defaultSortDirection: "desc",
        filter: { type: "date-range" },
      },
      {
        id: "due_date",
        label: "Due date",
        sortable: true,
        defaultSortDirection: "desc",
        filter: { type: "date-range" },
      },
      {
        id: "total_amount",
        label: "Total amount",
        sortable: true,
        align: "center",
        defaultSortDirection: "desc",
        filter: { type: "number-range" },
      },
      {
        id: "outstanding_amount",
        label: "Outstanding",
        sortable: true,
        align: "center",
        defaultSortDirection: "desc",
        filter: { type: "number-range" },
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        align: "center",
        accessor: getDisplayStatus,
        filter: { type: "select", options: STATUS_OPTIONS },
      },
      {
        id: "current_version",
        label: "Version",
        sortable: true,
        align: "center",
        accessor: (row) => row.current_version ?? 1,
        filter: { type: "number-range" },
      },
      {
        id: "po_link",
        label: "Purchase order",
        sortable: true,
        align: "center",
        accessor: (row) => getPoLinkState(row),
        filter: { type: "select", options: PO_LINK_OPTIONS },
      },
    ],
    []
  )

  const table = useClientTable({
    data: invoices,
    columns,
    pageSize: TABLE_PAGE_SIZE,
    paginationMode: bridge.paginationMode,
    serverTotal,
    page,
    onPageChange: setPage,
  })

  useSyncTableQueryBridge(bridge, table)

  useLayoutEffect(() => {
    const nextInvoice = table.filters["invoice_date"] as DateRangeFilterValue | undefined
    const nextDue = table.filters["due_date"] as DateRangeFilterValue | undefined
    const nextTotal = table.filters["total_amount"] as NumberRangeFilterValue | undefined
    const nextOutstanding = table.filters["outstanding_amount"] as
      | NumberRangeFilterValue
      | undefined
    setInvoiceDateRange((prev) =>
      JSON.stringify(prev ?? null) === JSON.stringify(nextInvoice ?? null) ? prev : nextInvoice
    )
    setDueDateRange((prev) =>
      JSON.stringify(prev ?? null) === JSON.stringify(nextDue ?? null) ? prev : nextDue
    )
    setTotalAmountRange((prev) =>
      JSON.stringify(prev ?? null) === JSON.stringify(nextTotal ?? null) ? prev : nextTotal
    )
    setOutstandingAmountRange((prev) =>
      JSON.stringify(prev ?? null) === JSON.stringify(nextOutstanding ?? null)
        ? prev
        : nextOutstanding
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

  const totalOpenBalance = table.filteredRows.reduce(
    (sum, i) => sum + i.outstanding_amount,
    0
  )

  const hasToolbarFilters = !!searchTerm
  const hasActiveFilters = hasToolbarFilters || table.hasNonDefaultState
  const showTableLoading = shouldShowTableLoading({
    isLoading,
    isFetching,
    isPlaceholderData,
    clientOnlyPaging: bridge.clientOnlyPaging,
    hasActiveFilters,
    cachedItemCount: invoices.length,
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
          { label: "Receivables" },
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

        <BillingsListToggle active="invoices" />
      </div>

      <Card>
        <div className="space-y-2 border-b border-border p-3">
          <FilterBar
            variant="toolbar"
            size="sm"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by invoice number or customer…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
            footer={
              <>
                Total open balance:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(totalOpenBalance)}
                </span>
              </>
            }
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
              <TableSkeleton rows={8} columns={9} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load billing invoices"
              description="Verify the Accounts Receivable database backend service is active and responsive."
              action={
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Retry fetch
                </Button>
              }
            />
          ) : table.filteredRows.length === 0 ? (
            <TableListEmpty
              sourceCount={serverTotal}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No invoices yet"
              emptyDescription="No billing invoices have been registered yet."
              emptyIcon={<Inbox className="h-6 w-6" />}
              noMatchesTitle="No invoices found"
              noMatchesDescription="No invoices match the current filters."
              onClearFilters={clearFilters}
            />
          ) : (
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
                {table.rows.map((inv) => {
                  const displayStatus = getDisplayStatus(inv)
                  return (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(inv.id)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.customer?.customer_name || "Active account"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.invoice_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center font-medium tabular-nums text-foreground">
                        {formatCurrency(inv.total_amount)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {formatCurrency(inv.outstanding_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusVariant(INVOICE_STATUS_VARIANT, displayStatus)}
                          shape="pill"
                        >
                          {displayStatus.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {inv.current_version ?? 1}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex justify-center">
                          <InvoicePoLinkBadge
                            poId={inv.po_id}
                            poNumber={inv.po_number}
                            compact
                          />
                          {!inv.po_id && !inv.po_number && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
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

export default InvoiceListPage
