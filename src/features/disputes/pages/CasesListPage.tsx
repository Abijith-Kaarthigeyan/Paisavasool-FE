import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCases } from "../hooks/useDisputes"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import type { DisputeCase } from "../types"
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
import { EmptyState } from "@/components/ui/empty-state"
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
import { FolderOpen, RefreshCw } from "lucide-react"

const INITIAL_SORT = { id: "created_at", direction: "desc" as const }
const URL_EXTRA_KEYS = ["q"] as const

export const CasesListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchTerm)
  const bridge = useTableQueryBridge({ page, initialSort: INITIAL_SORT })

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
    data: casesPage,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = useCases(listParams)
  const cases = casesPage?.items ?? []
  const serverTotal = casesPage?.total ?? 0

  const columns = useMemo<ColumnDef<DisputeCase>[]>(
    () => [
      {
        id: "case_number",
        label: "Case number",
        sortable: true,
        filter: { type: "text", placeholder: "Case number…" },
      },
      {
        id: "customer_email",
        label: "Customer email",
        sortable: true,
        filter: { type: "text", placeholder: "Email…" },
      },
      {
        id: "email_subject",
        label: "Subject",
        sortable: true,
        accessor: (row) => row.email_subject ?? "",
        filter: { type: "text", placeholder: "Subject…" },
      },
      {
        id: "dispute_count",
        label: "Disputes",
        sortable: true,
        align: "center",
        accessor: (row) => row.dispute_count ?? 0,
        filter: { type: "number-range" },
      },
      {
        id: "created_at",
        label: "Created",
        sortable: true,
        align: "right",
        defaultSortDirection: "desc",
        filter: { type: "date-range" },
      },
    ],
    []
  )

  const table = useClientTable({
    data: cases,
    columns,
    initialSort: INITIAL_SORT,
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
    defaultSort: INITIAL_SORT,
  })

  const hasActiveFilters = !!searchTerm || table.hasNonDefaultState
  const showTableLoading = shouldShowTableLoading({
    isLoading,
    isFetching,
    isPlaceholderData,
    clientOnlyPaging: bridge.clientOnlyPaging,
    hasActiveFilters,
    cachedItemCount: cases.length,
    pageSize: TABLE_PAGE_SIZE,
  })

  const clearFilters = () => {
    setSearchTerm("")
    table.clearAll()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageBreadcrumb
        items={[
          { label: "Disputes", to: "/disputes" },
          { label: "Intake email cases" },
        ]}
      />

      <PageHeader
        title="Intake email cases"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh cases
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
            searchPlaceholder="Search by case number, email, or subject…"
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
            <TableSkeleton rows={8} columns={5} />
          ) : isError ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6 text-destructive" />}
              title="Failed to load cases"
              description="Unable to retrieve the cases list from the database."
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <TableListEmpty
              sourceCount={serverTotal}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No cases yet"
              emptyDescription="No intake email cases have been created yet."
              emptyIcon={<FolderOpen className="h-6 w-6" />}
              noMatchesTitle="No cases found"
              noMatchesDescription="No cases match the current filters."
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
                {table.rows.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/disputes/cases/${c.id}`)}
                  >
                    <TableCell className="font-medium text-primary">{c.case_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {c.customer_email}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate font-medium">
                      {c.email_subject || "(No subject)"}
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums">
                      {c.dispute_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
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

export default CasesListPage
