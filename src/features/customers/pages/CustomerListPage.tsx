import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCustomers } from "../hooks/useCustomers"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { getDashboardPath } from "@/lib/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterBar } from "@/components/ui/filter-bar"
import { ActiveFilterChips } from "@/components/ui/active-filter-chips"
import { MobileColumnFilters } from "@/components/ui/mobile-column-filters"
import { SortableHeader } from "@/components/ui/sortable-header"
import { TableListEmpty } from "@/components/ui/table-list-empty"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TABLE_PAGE_SIZE,
  shouldShowTableLoading,
  useClientTable,
  useSyncTableQueryBridge,
  useTableQueryBridge,
  useTableUrlState,
  type ColumnDef,
} from "@/lib/table"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import { RefreshCw, HelpCircle, Inbox } from "lucide-react"
import type { Customer } from "../types"

const URL_EXTRA_KEYS = ["q"] as const

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchTerm)
  const bridge = useTableQueryBridge({ page })

  const listParams = useMemo(
    () => ({
      limit: bridge.limit,
      offset: bridge.offset,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(bridge.sortOverride
        ? {
            sort_by: bridge.sortOverride.id,
            sort_order: bridge.sortOverride.direction,
          }
        : {}),
    }),
    [bridge.limit, bridge.offset, bridge.sortOverride, debouncedSearch]
  )

  const {
    data: customersPage,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = useCustomers(listParams)

  const customers = customersPage?.items ?? []
  const serverTotal = customersPage?.total ?? 0

  const handleRowClick = (customerId: string) => {
    navigate(`/customers/${customerId}`)
  }

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        id: "customer_code",
        label: "Customer code",
        sortable: true,
        filter: { type: "text", placeholder: "Customer code…" },
      },
      {
        id: "customer_name",
        label: "Name",
        sortable: true,
        filter: { type: "text", placeholder: "Customer name…" },
      },
      {
        id: "email",
        label: "Email",
        sortable: true,
        accessor: (row) => row.email ?? "",
        filter: { type: "text", placeholder: "Email…" },
      },
      {
        id: "phone",
        label: "Phone",
        sortable: true,
        accessor: (row) => row.phone ?? "",
        filter: { type: "text", placeholder: "Phone…" },
      },
      {
        id: "billing_address",
        label: "Billing address",
        sortable: true,
        accessor: (row) => row.billing_address ?? "",
        filter: { type: "text", placeholder: "Address…" },
      },
    ],
    []
  )

  const table = useClientTable({
    data: customers,
    columns,
    pageSize: TABLE_PAGE_SIZE,
    paginationMode: bridge.paginationMode,
    serverTotal,
    page,
    onPageChange: setPage,
  })

  useSyncTableQueryBridge(bridge, table)

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

  const hasActiveFilters = !!searchTerm || table.hasNonDefaultState
  const showTableLoading = shouldShowTableLoading({
    isLoading,
    isFetching,
    isPlaceholderData,
    clientOnlyPaging: bridge.clientOnlyPaging,
    hasActiveFilters,
    cachedItemCount: customers.length,
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
          { label: "Customers directory" },
        ]}
      />

      <PageHeader
        title="Customers directory"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh directory
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
            searchPlaceholder="Search by name, customer code, or email…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
            footer={
              <>
                Total customers:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {serverTotal}
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
              <TableSkeleton rows={8} columns={5} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load customers"
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
              emptyTitle="No customers yet"
              emptyDescription="No customers have been registered yet."
              emptyIcon={<Inbox className="h-6 w-6" />}
              noMatchesTitle="No customers found"
              noMatchesDescription="No customers match the search criteria."
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
                {table.rows.map((cust) => (
                  <TableRow
                    key={cust.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(cust.id)}
                  >
                    <TableCell className="font-medium text-primary">
                      {cust.customer_code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {cust.customer_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cust.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cust.phone || "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {cust.billing_address || "—"}
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

export default CustomerListPage
