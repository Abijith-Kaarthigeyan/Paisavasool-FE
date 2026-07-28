import React, { useMemo, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { buildDisputeDetailPath } from "../utils/disputeBreadcrumbs"
import { Dispute } from "../types"
import { useDisputes } from "../hooks/useDisputes"
import { useCustomers } from "@/features/customers/hooks/useCustomers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb, type BreadcrumbItem } from "@/components/ui/page-breadcrumb"
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar"
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
import { SLAProgress } from "./SLAProgress"
import { isTerminalDisputeStatus } from "../utils/disputeFormatters"
import {
  DISPUTE_STATUS_VARIANT,
  PRIORITY_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import {
  CLIENT_FETCH_CAP,
  TABLE_PAGE_SIZE,
  isEmptyFilterValue,
  shouldShowTableLoading,
  useClientTable,
  useTableUrlState,
  type ColumnDef,
  type DateRangeFilterValue,
  type FilterValues,
  type SortState,
} from "@/lib/table"
import { FolderOpen, Inbox, RefreshCw } from "lucide-react"
import { isUnclassifiedDisputeCategory, UNCLASSIFIED_DISPUTE_CATEGORY } from "@/features/dashboard/utils/chartDrillDown"

const DISPUTE_CATEGORIES = [
  "AMENDMENT",
  "PAYMENT_ALREADY_DONE",
  "PAYMENT_NOT_REFLECTED",
  "DUPLICATE_INVOICE",
  "QUALITY",
  "LATE_DELIVERY",
  "OTHER",
]

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "WAITING_CUSTOMER", label: "Waiting customer" },
  { value: "WAITING_INTERNAL", label: "Waiting internal" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
]

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "CLOSED", label: "Closed" },
  { value: "N/A", label: "N/A" },
]

const INITIAL_SORT = { id: "created_at", direction: "desc" as const }
const URL_EXTRA_KEYS = ["q", "customer"] as const
const PRESERVE_KEYS = ["sla", "team"] as const

/** API allowlisted sort columns — anything else needs a full client-side page. */
const SERVER_SORT_IDS = new Set([
  "created_at",
  "opened_at",
  "dispute_number",
  "invoice_number",
  "status",
  "dispute_category",
])

/**
 * Column filters that cannot be expressed exactly by the list API
 * (computed fields, name text, or partial text vs exact API match).
 * When any of these are active we fetch a capped full list and paginate locally.
 */
const CLIENT_ONLY_COLUMN_FILTER_IDS = new Set([
  "priority",
  "sla_percentage",
  "assigned_user_name",
  "dispute_number",
  "invoice_number",
])

interface DisputesTableProps {
  title: string
  breadcrumbItems?: BreadcrumbItem[]
  /** Extra server-side params always applied (e.g. exclude_statuses for Open). */
  baseParams?: {
    status?: string
    exclude_statuses?: string
    has_assignee?: boolean
  }
  /** When provided, use client-side filtering on this data (e.g. My Assigned). */
  disputes?: Dispute[]
  isLoading?: boolean
  isError?: boolean
  refetch?: () => void
}

function getPriorityKey(dispute: Dispute): string {
  if (isTerminalDisputeStatus(dispute.status) || dispute.sla?.status === "CLOSED") {
    return "CLOSED"
  }
  if (!dispute.sla) return "N/A"
  if (dispute.sla.status === "BREACHED") return "HIGH"
  if (dispute.sla.status === "AT_RISK") return "MEDIUM"
  return "LOW"
}

function getPriorityLabel(key: string): string {
  if (key === "CLOSED" || key === "N/A") return key
  return key
}

export const DisputesTable: React.FC<DisputesTableProps> = ({
  title,
  breadcrumbItems,
  baseParams,
  disputes: externalDisputes,
  isLoading: externalLoading,
  isError: externalError,
  refetch: externalRefetch,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const serverMode = externalDisputes === undefined

  const [searchTerm, setSearchTerm] = useState("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchTerm)

  // Mirrors table.sort / table.filters so the server-side request can include
  // sort_by/sort_order and column filters without a circular dependency on the
  // useClientTable instance, which itself consumes the fetched rows.
  const [sortOverride, setSortOverride] = useState<SortState>(INITIAL_SORT)
  const [columnFilters, setColumnFilters] = useState<FilterValues>({})

  const slaParam = searchParams.get("sla")
  const teamParam = searchParams.get("team")

  const columnStatus =
    typeof columnFilters.status === "string" ? columnFilters.status : ""
  const columnCategory =
    typeof columnFilters.dispute_category === "string"
      ? columnFilters.dispute_category
      : ""
  const columnCreatedAt = columnFilters.created_at as DateRangeFilterValue | undefined

  const effectiveStatus = columnStatus
  const effectiveCategory = columnCategory
  const effectiveUnclassified = isUnclassifiedDisputeCategory(effectiveCategory)

  const hasClientOnlyColumnFilter = Object.entries(columnFilters).some(
    ([id, value]) =>
      !isEmptyFilterValue(value) && CLIENT_ONLY_COLUMN_FILTER_IDS.has(id)
  )
  const sortNeedsClientPaging = !!(
    sortOverride?.id && !SERVER_SORT_IDS.has(sortOverride.id)
  )

  // Fall back to a capped fetch whenever filtering/sorting cannot be done on the
  // server — otherwise client filters would only see the current page of rows.
  const clientOnlyPaging =
    serverMode &&
    (effectiveUnclassified || hasClientOnlyColumnFilter || sortNeedsClientPaging)

  const listParams = useMemo(() => {
    if (!serverMode) return undefined
    return {
      limit: clientOnlyPaging ? CLIENT_FETCH_CAP : TABLE_PAGE_SIZE,
      offset: clientOnlyPaging ? 0 : (page - 1) * TABLE_PAGE_SIZE,
      ...baseParams,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(effectiveStatus ? { status: effectiveStatus } : {}),
      ...(effectiveCategory && !effectiveUnclassified
        ? { category: effectiveCategory }
        : {}),
      ...(customerFilter ? { customer_id: customerFilter } : {}),
      ...(slaParam === "breached" ? { sla_status: "BREACHED" } : {}),
      ...(teamParam === "true" ? { has_assignee: true } : {}),
      ...(columnCreatedAt?.from ? { created_at_from: columnCreatedAt.from } : {}),
      ...(columnCreatedAt?.to ? { created_at_to: columnCreatedAt.to } : {}),
      ...(sortOverride && SERVER_SORT_IDS.has(sortOverride.id)
        ? { sort_by: sortOverride.id, sort_order: sortOverride.direction }
        : {}),
    }
  }, [
    serverMode,
    clientOnlyPaging,
    page,
    baseParams,
    debouncedSearch,
    effectiveStatus,
    effectiveCategory,
    effectiveUnclassified,
    customerFilter,
    slaParam,
    teamParam,
    columnCreatedAt,
    sortOverride,
  ])

  const {
    data: serverDisputes = [],
    total: serverTotal = 0,
    isLoading: serverLoading,
    isFetching: serverFetching,
    isPlaceholderData: serverPlaceholder,
    isError: serverError,
    refetch: serverRefetch,
  } = useDisputes(listParams, { enabled: serverMode })

  const { data: customersPage } = useCustomers({ limit: CLIENT_FETCH_CAP })
  const customers = customersPage?.items ?? []

  const disputes = serverMode ? serverDisputes : (externalDisputes ?? [])
  const isLoading = serverMode ? serverLoading : !!externalLoading
  const isFetching = serverMode ? serverFetching : false
  const isError = serverMode ? serverError : !!externalError
  const refetch = serverMode ? serverRefetch : externalRefetch ?? (() => {})

  const customerOptions = useMemo(() => {
    if (serverMode) {
      return customers
        .map((c) => ({ id: c.id, name: c.customer_name }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }

    const customerNames = new Set<string>()
    disputes.forEach((d) => {
      if (d.customer?.customer_name) customerNames.add(d.customer.customer_name)
    })
    return Array.from(customerNames)
      .sort()
      .map((name) => ({ id: name, name }))
  }, [disputes, serverMode, customers])

  const toolbarFiltered = useMemo(() => {
    return serverMode
      ? disputes.filter((d) => {
          if (!effectiveUnclassified) return true
          return !d.dispute_category
        })
      : disputes.filter((d) => {
          const term = searchTerm.toLowerCase()
          const matchesSearch =
            !term ||
            d.dispute_number.toLowerCase().includes(term) ||
            d.invoice_number.toLowerCase().includes(term) ||
            (d.customer?.customer_name || "").toLowerCase().includes(term)

          const matchesCustomer =
            !customerFilter || d.customer?.customer_name === customerFilter
          const matchesSlaParam =
            slaParam !== "breached" || d.sla?.status === "BREACHED"
          const matchesTeamParam = teamParam !== "true" || !!d.assigned_to

          return (
            matchesSearch &&
            matchesCustomer &&
            matchesSlaParam &&
            matchesTeamParam
          )
        })
  }, [
    disputes,
    serverMode,
    searchTerm,
    customerFilter,
    slaParam,
    teamParam,
    effectiveUnclassified,
  ])

  const columns = useMemo<ColumnDef<Dispute>[]>(
    () => [
      {
        id: "dispute_number",
        label: "Dispute number",
        sortable: true,
        filter: { type: "text", placeholder: "Dispute number…" },
      },
      {
        id: "invoice_number",
        label: "Invoice",
        sortable: true,
        filter: { type: "text", placeholder: "Invoice number…" },
      },
      {
        id: "dispute_category",
        label: "Category",
        sortable: true,
        accessor: (row) => row.dispute_category || UNCLASSIFIED_DISPUTE_CATEGORY,
        filter: {
          type: "select",
          options: [
            ...DISPUTE_CATEGORIES.map((cat) => ({
              value: cat,
              label: cat.replace(/_/g, " "),
            })),
            {
              value: UNCLASSIFIED_DISPUTE_CATEGORY,
              label: UNCLASSIFIED_DISPUTE_CATEGORY,
            },
          ],
        },
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        align: "center",
        filter: { type: "select", options: STATUS_OPTIONS },
      },
      {
        id: "priority",
        label: "Priority",
        sortable: true,
        align: "center",
        accessor: getPriorityKey,
        filter: { type: "select", options: PRIORITY_OPTIONS },
      },
      {
        id: "sla_percentage",
        label: "SLA status",
        sortable: true,
        className: "w-40",
        accessor: (row) => row.sla?.current_percentage ?? 0,
        defaultSortDirection: "desc",
        filter: { type: "number-range", placeholder: "%" },
      },
      {
        id: "assigned_user_name",
        label: "Assigned to",
        sortable: true,
        accessor: (row) => row.assigned_user_name ?? "",
        filter: { type: "text", placeholder: "Assignee…" },
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
    data: toolbarFiltered,
    columns,
    initialSort: INITIAL_SORT,
    pageSize: TABLE_PAGE_SIZE,
    paginationMode: serverMode ? (clientOnlyPaging ? "client" : "server") : "client",
    serverTotal: serverMode ? serverTotal : 0,
    page,
    onPageChange: setPage,
  })

  // Sync during render so filter changes update list params in the same turn
  // (avoids one paint of the previous page's filtered rows).
  const filtersKey = JSON.stringify(table.filters)
  const sortKey = `${table.sort?.id ?? ""}:${table.sort?.direction ?? ""}`
  const [syncedKeys, setSyncedKeys] = useState({ filtersKey, sortKey })
  if (syncedKeys.filtersKey !== filtersKey || syncedKeys.sortKey !== sortKey) {
    setSyncedKeys({ filtersKey, sortKey })
    setSortOverride((prev) =>
      prev?.id === table.sort?.id && prev?.direction === table.sort?.direction
        ? prev
        : table.sort
    )
    setColumnFilters((prev) =>
      JSON.stringify(prev) === JSON.stringify(table.filters) ? prev : table.filters
    )
  }

  const urlExtras = useMemo(
    () => ({
      q: searchTerm || undefined,
      customer: customerFilter || undefined,
    }),
    [searchTerm, customerFilter]
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
    preserveKeys: [...PRESERVE_KEYS],
    defaultSort: INITIAL_SORT,
    onExtrasChange: (extras) => {
      if (extras.q != null) setSearchTerm(extras.q)
      if (extras.customer != null) setCustomerFilter(extras.customer)
    },
  })

  const hasToolbarFilters = !!searchTerm || !!customerFilter

  const hasActiveFilters = hasToolbarFilters || table.hasNonDefaultState

  const showTableLoading = shouldShowTableLoading({
    isLoading,
    isFetching,
    isPlaceholderData: serverMode ? serverPlaceholder : false,
    clientOnlyPaging,
    hasActiveFilters,
    cachedItemCount: disputes.length,
    pageSize: TABLE_PAGE_SIZE,
  })

  const clearFilters = () => {
    setSearchTerm("")
    setCustomerFilter("")
    table.clearAll()
  }

  const emptySourceCount = serverMode ? serverTotal : disputes.length

  const breadcrumb = breadcrumbItems ?? [
    { label: "Disputes", to: "/disputes" },
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
            searchPlaceholder="Search by dispute ID or invoice…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
          >
            <FilterSelect
              id="filter-customer"
              aria-label="Customer"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option value="">All customers</option>
              {customerOptions.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </FilterSelect>
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
            <TableSkeleton rows={8} columns={8} />
          ) : isError ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6 text-destructive" />}
              title="Failed to load disputes"
              description="Unable to retrieve disputes from the server."
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
              emptyTitle="No disputes yet"
              emptyDescription="No disputes have been registered yet."
              emptyIcon={<Inbox className="h-6 w-6" />}
              noMatchesTitle="No disputes found"
              noMatchesDescription="No active disputes match the current filters."
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
                {table.rows.map((d) => {
                  const priorityKey = getPriorityKey(d)
                  return (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(
                          buildDisputeDetailPath(d.id, {
                            path: `${location.pathname}${location.search}`,
                          })
                        )
                      }
                    >
                      <TableCell className="font-medium text-primary">
                        {d.dispute_number}
                      </TableCell>
                      <TableCell className="font-medium">{d.invoice_number}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.dispute_category}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusVariant(DISPUTE_STATUS_VARIANT, d.status)}
                          shape="pill"
                        >
                          {d.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            priorityKey === "CLOSED" || priorityKey === "N/A"
                              ? "outline"
                              : getStatusVariant(PRIORITY_VARIANT, priorityKey)
                          }
                          shape="pill"
                        >
                          {getPriorityLabel(priorityKey)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {d.sla ? (
                          <SLAProgress
                            percentage={d.sla.current_percentage}
                            isPaused={d.sla.is_paused}
                            status={d.sla.status}
                            disputeStatus={d.status}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">No SLA mapped</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.assigned_user_name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString()}
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
