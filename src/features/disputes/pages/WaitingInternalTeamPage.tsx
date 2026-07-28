import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { buildDisputeDetailPath } from "../utils/disputeBreadcrumbs"
import { useDisputes } from "../hooks/useDisputes"
import { isWaitingInternalTeamDispute } from "../utils/disputeFormatters"
import type { Dispute } from "../types"
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
import { useClientTable, TABLE_PAGE_SIZE, CLIENT_FETCH_CAP, type ColumnDef } from "@/lib/table"
import { RefreshCw, FolderOpen, ArrowRight, Home, Inbox } from "lucide-react"

type WaitingInternalRow = Dispute & {
  daysWaiting: number
  department: string
  action: string
}

const INITIAL_SORT = { id: "daysWaiting", direction: "desc" as const }

export const WaitingInternalTeamPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes({
    limit: CLIENT_FETCH_CAP,
  })
  const [searchTerm, setSearchTerm] = useState("")

  const waitingDisputes = useMemo(() => {
    return disputes.filter(isWaitingInternalTeamDispute)
  }, [disputes])

  const disputesEnriched = useMemo<WaitingInternalRow[]>(() => {
    return waitingDisputes.map((d) => {
      const updatedDate = new Date(d.updated_at).getTime()
      const now = Date.now()
      const diffTime = Math.abs(now - updatedDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1

      let department = "Finance audit"
      let action = "Verify ledger entries and credit limits"

      if (d.dispute_category === "PRICING_DISCREPANCY") {
        department = "Sales & account management"
        action = "Confirm contractual agreement pricing details"
      } else if (d.dispute_category === "TAX_DISCREPANCY") {
        department = "Tax & compliance"
        action = "Examine tax-exempt certifications"
      } else if (d.dispute_category === "RETURNS_EXCHANGES") {
        department = "Logistics operations"
        action = "Audit warehouse goods receipt notes (GRN)"
      }

      return { ...d, daysWaiting: diffDays, department, action }
    })
  }, [waitingDisputes])

  const toolbarFiltered = useMemo(() => {
    if (!searchTerm.trim()) return disputesEnriched
    const term = searchTerm.toLowerCase()
    return disputesEnriched.filter(
      (d) =>
        d.dispute_number.toLowerCase().includes(term) ||
        d.invoice_number.toLowerCase().includes(term) ||
        d.department.toLowerCase().includes(term) ||
        (d.assigned_user_name || "").toLowerCase().includes(term) ||
        d.action.toLowerCase().includes(term)
    )
  }, [disputesEnriched, searchTerm])

  const columns = useMemo<ColumnDef<WaitingInternalRow>[]>(
    () => [
      {
        id: "dispute_number",
        label: "Dispute",
        sortable: true,
        filter: { type: "text", placeholder: "Dispute number…" },
      },
      {
        id: "invoice_number",
        label: "Invoice",
        sortable: true,
        filter: { type: "text", placeholder: "Invoice…" },
      },
      {
        id: "department",
        label: "Department",
        sortable: true,
        filter: { type: "text", placeholder: "Department…" },
      },
      {
        id: "assigned_user_name",
        label: "Associate",
        sortable: true,
        accessor: (row) => row.assigned_user_name ?? "Unassigned",
        filter: { type: "text", placeholder: "Associate…" },
      },
      {
        id: "daysWaiting",
        label: "Days waiting",
        sortable: true,
        align: "center",
        defaultSortDirection: "desc",
        filter: { type: "number-range" },
      },
      {
        id: "action",
        label: "Pending action",
        sortable: true,
        filter: { type: "text", placeholder: "Action…" },
      },
      {
        id: "view",
        label: " ",
        align: "right",
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

  const hasActiveFilters = !!searchTerm || table.hasNonDefaultState

  const clearFilters = () => {
    setSearchTerm("")
    table.clearAll()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageBreadcrumb
        items={[
          { label: "Disputes", to: "/disputes" },
          { label: "Waiting for internal teams" },
        ]}
      />

      <PageHeader
        title="Waiting for internal teams"
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
            searchPlaceholder="Search by dispute, department, or associate…"
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
            <TableSkeleton rows={6} columns={7} />
          ) : isError ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6 text-destructive" />}
              title="Failed to load queue"
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <TableListEmpty
              sourceCount={disputesEnriched.length}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No pending internal reviews"
              emptyDescription="No disputes are currently waiting on internal team responses."
              emptyIcon={<Inbox className="h-6 w-6" />}
              noMatchesTitle="No disputes found"
              noMatchesDescription="No waiting-internal disputes match the current filters."
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
                {table.rows.map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(
                        buildDisputeDetailPath(d.id, { path: "/disputes/waiting-internal" })
                      )
                    }
                  >
                    <TableCell className="font-medium text-primary">
                      {d.dispute_number}
                    </TableCell>
                    <TableCell className="font-medium">{d.invoice_number}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <Home className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        {d.department}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.assigned_user_name || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums">
                      {d.daysWaiting} days
                    </TableCell>
                    <TableCell className="max-w-[240px] text-muted-foreground">
                      {d.action}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary">
                        View
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
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

export default WaitingInternalTeamPage
