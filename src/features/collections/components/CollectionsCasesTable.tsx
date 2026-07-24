import React, { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CollectionCase } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb, type BreadcrumbItem } from "@/components/ui/page-breadcrumb"
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
  AGING_BUCKET_VARIANT,
  PRIORITY_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { formatCurrency } from "@/lib/formatCurrency"
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

export interface CollectionsCasesTableProps {
  cases: CollectionCase[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  title: string
  showAssignedColumn?: boolean
  filterMode?: "full" | "basic"
  breadcrumbItems?: BreadcrumbItem[]
  serverTotal?: number
  page?: number
  onPageChange?: (page: number) => void
  isFetching?: boolean
  isPlaceholderData?: boolean
  onNeedsClientPagingChange?: (needsClientPaging: boolean) => void
}

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
]

const BUCKET_OPTIONS = [
  { value: "CURRENT", label: "Current" },
  { value: "0-30", label: "0–30 days" },
  { value: "31-60", label: "31–60 days" },
  { value: "61-90", label: "61–90 days" },
  { value: "90_PLUS", label: "90+ days" },
]

const INITIAL_SORT = { id: "opened_at", direction: "desc" as const }

const URL_EXTRA_KEYS = ["q"] as const

export const CollectionsCasesTable: React.FC<CollectionsCasesTableProps> = ({
  cases,
  isLoading,
  isError,
  refetch,
  title,
  showAssignedColumn = true,
  breadcrumbItems,
  serverTotal,
  page: controlledPage,
  onPageChange,
  isFetching,
  isPlaceholderData,
  onNeedsClientPagingChange,
}) => {
  const navigate = useNavigate()

  const serverMode =
    serverTotal !== undefined && controlledPage !== undefined && !!onPageChange

  const [searchTerm, setSearchTerm] = useState("")

  const hasToolbarFilters = !!searchTerm

  const bridge = useTableQueryBridge({
    page: controlledPage ?? 1,
    initialSort: INITIAL_SORT,
    forceClientOnly: !!searchTerm, // search is client-side on the fetched rows
  })

  useLayoutEffect(() => {
    onNeedsClientPagingChange?.(bridge.clientOnlyPaging)
  }, [bridge.clientOnlyPaging, onNeedsClientPagingChange])

  const toolbarFiltered = useMemo(() => {
    return cases.filter((c) => {
      const term = searchTerm.toLowerCase()
      if (!term) return true
      return (
        c.id.toLowerCase().includes(term) ||
        (c.customer?.customer_name || "").toLowerCase().includes(term) ||
        (c.invoice?.invoice_number || "").toLowerCase().includes(term)
      )
    })
  }, [cases, searchTerm])

  const columns = useMemo<ColumnDef<CollectionCase>[]>(() => {
    const cols: ColumnDef<CollectionCase>[] = [
      {
        id: "invoice_number",
        label: "Invoice",
        sortable: true,
        accessor: (row) => row.invoice?.invoice_number ?? "",
        filter: { type: "text", placeholder: "Invoice…" },
      },
      {
        id: "customer_name",
        label: "Customer",
        sortable: true,
        accessor: (row) => row.customer?.customer_name ?? "",
        filter: { type: "text", placeholder: "Customer…" },
      },
      {
        id: "outstanding_amount",
        label: "Outstanding",
        sortable: true,
        align: "right",
        defaultSortDirection: "desc",
        accessor: (row) =>
          row.invoice?.outstanding_amount ?? row.outstanding_amount_snapshot,
        filter: { type: "number-range" },
      },
      {
        id: "aging_bucket",
        label: "Bucket",
        sortable: true,
        align: "center",
        filter: { type: "select", options: BUCKET_OPTIONS },
      },
      {
        id: "priority",
        label: "Priority",
        sortable: true,
        align: "center",
        filter: { type: "select", options: PRIORITY_OPTIONS },
      },
    ]

    if (showAssignedColumn) {
      cols.push({
        id: "assigned_associate_name",
        label: "Assigned to",
        sortable: true,
        accessor: (row) => row.assigned_associate_name ?? "",
        filter: { type: "text", placeholder: "Associate…" },
      })
    }

    cols.push({
      id: "opened_at",
      label: "Opened",
      sortable: true,
      align: "right",
      defaultSortDirection: "desc",
      filter: { type: "date-range" },
    })

    return cols
  }, [showAssignedColumn])

  const table = useClientTable({
    data: toolbarFiltered,
    columns,
    initialSort: INITIAL_SORT,
    pageSize: TABLE_PAGE_SIZE,
    paginationMode: serverMode && !bridge.clientOnlyPaging ? "server" : "client",
    serverTotal: serverMode ? serverTotal : 0,
    page: serverMode ? controlledPage : undefined,
    onPageChange: serverMode ? onPageChange : undefined,
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

  useEffect(() => {
    table.setPage(1)
    // Only reset when toolbar search changes; column filters reset page inside the hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const hasActiveFilters = hasToolbarFilters || table.hasNonDefaultState

  const showLoading = shouldShowTableLoading({
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

  const emptySourceCount = serverMode ? (serverTotal ?? 0) : cases.length

  const breadcrumb = breadcrumbItems ?? [
    { label: "Collections", to: "/collections" },
    { label: title },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageBreadcrumb items={breadcrumb} />

      <PageHeader
        title={title}
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
            searchPlaceholder="Search by case ID, customer, or invoice…"
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
          {showLoading ? (
            <TableSkeleton rows={8} columns={showAssignedColumn ? 7 : 6} />
          ) : isError ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6 text-destructive" />}
              title="Failed to load collection cases"
              description="Unable to retrieve cases from the server."
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <TableListEmpty
              sourceCount={emptySourceCount}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No cases found"
              emptyDescription="No collection cases are available."
              emptyIcon={<FolderOpen className="h-6 w-6" />}
              noMatchesTitle="No cases found"
              noMatchesDescription="No collection cases match the current filters."
              onClearFilters={clearFilters}
            />
          )}
          {!showLoading && !isError && table.filteredRows.length > 0 && (
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
                        {c.invoice?.invoice_number || "INV-N/A"}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">
                        {c.customer?.customer_name || "Active client"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(outstanding)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusVariant(AGING_BUCKET_VARIANT, c.aging_bucket)}
                          shape="pill"
                        >
                          {c.aging_bucket}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusVariant(PRIORITY_VARIANT, c.priority)}
                          shape="pill"
                        >
                          {c.priority}
                        </Badge>
                      </TableCell>
                      {showAssignedColumn && (
                        <TableCell className="text-muted-foreground">
                          {c.assigned_associate_name}
                        </TableCell>
                      )}
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {new Date(c.opened_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!showLoading && !isError && table.totalPages > 1 && (
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
