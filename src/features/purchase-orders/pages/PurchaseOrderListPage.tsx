import React, { useLayoutEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePurchaseOrders } from "../hooks/usePurchaseOrders"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { RefreshCw, HelpCircle, ClipboardList } from "lucide-react"
import { PurchaseOrderStatusBadge } from "../components/PurchaseOrderStatusBadge"
import { PoGrnLinkBadge } from "../components/PoGrnLinkBadge"
import { BillingsListToggle } from "@/features/invoices/components/BillingsListToggle"
import type { PurchaseOrder } from "../types"

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "PARTIALLY_INVOICED", label: "Partially invoiced" },
  { value: "FULLY_INVOICED", label: "Fully invoiced" },
]

const URL_EXTRA_KEYS = ["q"] as const

export const PurchaseOrderListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchTerm)
  const bridge = useTableQueryBridge({ page })

  // Mirror date/amount column filters to API params (optimization).
  const [poDateRange, setPoDateRange] = useState<DateRangeFilterValue>()
  const [totalAmountRange, setTotalAmountRange] = useState<NumberRangeFilterValue>()

  const listParams = useMemo(
    () => ({
      limit: bridge.limit,
      offset: bridge.offset,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(poDateRange?.from ? { po_date_from: poDateRange.from } : {}),
      ...(poDateRange?.to ? { po_date_to: poDateRange.to } : {}),
      ...(totalAmountRange?.min != null
        ? { total_amount_min: totalAmountRange.min }
        : {}),
      ...(totalAmountRange?.max != null
        ? { total_amount_max: totalAmountRange.max }
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
      poDateRange,
      totalAmountRange,
    ]
  )

  const {
    data: poPage,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = usePurchaseOrders(listParams)

  const purchaseOrders = poPage?.items ?? []
  const serverTotal = poPage?.total ?? 0

  const columns = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      {
        id: "po_number",
        label: "PO number",
        sortable: true,
        filter: { type: "text", placeholder: "PO number…" },
      },
      {
        id: "customer",
        label: "Customer",
        sortable: true,
        accessor: (row) => row.customer?.customer_name ?? "",
        filter: { type: "text", placeholder: "Customer name…" },
      },
      {
        id: "po_date",
        label: "PO date",
        sortable: true,
        defaultSortDirection: "desc",
        filter: { type: "date-range" },
      },
      {
        id: "requested_delivery_date",
        label: "Requested delivery",
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
        id: "status",
        label: "Status",
        sortable: true,
        align: "center",
        filter: { type: "select", options: STATUS_OPTIONS },
      },
      {
        id: "linked_invoice_count",
        label: "Linked invoices",
        sortable: true,
        align: "center",
        defaultSortDirection: "desc",
        filter: { type: "number-range" },
      },
      {
        id: "linked_grn_count",
        label: "GRN",
        sortable: true,
        align: "center",
        defaultSortDirection: "desc",
        filter: { type: "number-range" },
      },
    ],
    []
  )

  const table = useClientTable({
    data: purchaseOrders,
    columns,
    pageSize: TABLE_PAGE_SIZE,
    paginationMode: bridge.paginationMode,
    serverTotal,
    page,
    onPageChange: setPage,
  })

  useSyncTableQueryBridge(bridge, table)

  useLayoutEffect(() => {
    const nextPoDate = table.filters["po_date"] as DateRangeFilterValue | undefined
    const nextTotal = table.filters["total_amount"] as NumberRangeFilterValue | undefined
    setPoDateRange((prev) =>
      JSON.stringify(prev ?? null) === JSON.stringify(nextPoDate ?? null) ? prev : nextPoDate
    )
    setTotalAmountRange((prev) =>
      JSON.stringify(prev ?? null) === JSON.stringify(nextTotal ?? null) ? prev : nextTotal
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

  const totalPoValue = table.filteredRows.reduce((sum, po) => sum + po.total_amount, 0)

  const hasToolbarFilters = !!searchTerm
  const hasActiveFilters = hasToolbarFilters || table.hasNonDefaultState
  const showTableLoading = shouldShowTableLoading({
    isLoading,
    isFetching,
    isPlaceholderData,
    clientOnlyPaging: bridge.clientOnlyPaging,
    hasActiveFilters,
    cachedItemCount: purchaseOrders.length,
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
          { label: "Purchase orders" },
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

        <BillingsListToggle active="purchase-orders" />
      </div>

      <Card>
        <div className="space-y-2 border-b border-border p-3">
          <FilterBar
            variant="toolbar"
            size="sm"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by PO number or customer…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
            footer={
              <>
                Total PO value:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(totalPoValue)}
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
              <TableSkeleton rows={8} columns={8} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load purchase orders"
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
              emptyTitle="No purchase orders yet"
              emptyDescription="No purchase orders have been registered yet."
              emptyIcon={<ClipboardList className="h-6 w-6" />}
              noMatchesTitle="No purchase orders found"
              noMatchesDescription="No purchase orders match the current filters."
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
                {table.rows.map((po) => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {po.po_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {po.customer?.customer_name || "Active account"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(po.po_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {po.requested_delivery_date
                        ? new Date(po.requested_delivery_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums text-foreground">
                      {formatCurrency(po.total_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <PurchaseOrderStatusBadge status={po.status} />
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {po.linked_invoice_count > 0 ? po.linked_invoice_count : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex justify-center">
                        <PoGrnLinkBadge linkedGrnCount={po.linked_grn_count} />
                      </span>
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

export default PurchaseOrderListPage
