import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { buildDisputeDetailPath } from "../utils/disputeBreadcrumbs"
import { useDisputes } from "../hooks/useDisputes"
import type { Dispute } from "../types"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useClientTable, TABLE_PAGE_SIZE, CLIENT_FETCH_CAP, type ColumnDef } from "@/lib/table"
import { RefreshCw, FolderOpen, ArrowRight, PauseCircle, Inbox } from "lucide-react"

type WaitingCustomerRow = Dispute & {
  daysWaiting: number
  latestMessage: string
}

const INITIAL_SORT = { id: "daysWaiting", direction: "desc" as const }

export const WaitingCustomerPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes({
    limit: CLIENT_FETCH_CAP,
  })
  const [searchTerm, setSearchTerm] = useState("")

  const waitingDisputes = useMemo(() => {
    return disputes.filter((d) => d.status === "WAITING_CUSTOMER")
  }, [disputes])

  const disputesEnriched = useMemo<WaitingCustomerRow[]>(() => {
    return waitingDisputes.map((d) => {
      const updatedDate = new Date(d.updated_at).getTime()
      const now = Date.now()
      const diffTime = Math.abs(now - updatedDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1

      return {
        ...d,
        daysWaiting: diffDays,
        latestMessage: "Please provide tax exemption certificate proof…",
      }
    })
  }, [waitingDisputes])

  const toolbarFiltered = useMemo(() => {
    if (!searchTerm.trim()) return disputesEnriched
    const term = searchTerm.toLowerCase()
    return disputesEnriched.filter(
      (d) =>
        d.dispute_number.toLowerCase().includes(term) ||
        d.invoice_number.toLowerCase().includes(term) ||
        (d.customer?.email || "").toLowerCase().includes(term) ||
        d.latestMessage.toLowerCase().includes(term)
    )
  }, [disputesEnriched, searchTerm])

  const columns = useMemo<ColumnDef<WaitingCustomerRow>[]>(
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
        id: "customer_email",
        label: "Customer email",
        sortable: true,
        accessor: (row) => row.customer?.email ?? "billing@client.com",
        filter: { type: "text", placeholder: "Email…" },
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
        id: "latestMessage",
        label: "Latest message",
        sortable: true,
        filter: { type: "text", placeholder: "Message…" },
      },
      {
        id: "sla",
        label: "SLA",
        sortable: true,
        align: "center",
        accessor: (row) => row.sla?.status ?? "PAUSED",
        filter: { type: "text", placeholder: "SLA…" },
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
          { label: "Waiting for customer" },
        ]}
      />

      <PageHeader
        title="Waiting for customer"
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
            searchPlaceholder="Search by dispute, invoice, or email…"
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
              title="Failed to load disputes"
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
              emptyTitle="No pending customer responses"
              emptyDescription="No disputes are currently waiting on customer input."
              emptyIcon={<Inbox className="h-6 w-6" />}
              noMatchesTitle="No disputes found"
              noMatchesDescription="No waiting-customer disputes match the current filters."
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
                        buildDisputeDetailPath(d.id, { path: "/disputes/waiting-customer" })
                      )
                    }
                  >
                    <TableCell className="font-medium text-primary">
                      {d.dispute_number}
                    </TableCell>
                    <TableCell className="font-medium">{d.invoice_number}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.customer?.email || "billing@client.com"}
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums">
                      {d.daysWaiting} days
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate text-muted-foreground"
                      title={d.latestMessage}
                    >
                      {d.latestMessage}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="warning" shape="pill" className="gap-1">
                        <PauseCircle className="h-3 w-3" aria-hidden />
                        SLA paused
                      </Badge>
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

export default WaitingCustomerPage
