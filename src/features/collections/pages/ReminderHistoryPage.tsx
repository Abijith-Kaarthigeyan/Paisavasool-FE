import React, { useMemo, useState } from "react"
import { useReminderHistory } from "../hooks/useCollections"
import type { ReminderHistory } from "../types"
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
import { REMINDER_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { TABLE_PAGE_SIZE, useClientTable, type ColumnDef } from "@/lib/table"
import { Inbox, Mail, RefreshCw } from "lucide-react"
import {
  getReminderDisplayDate,
  getReminderStatusDescription,
  getReminderStatusLabel,
} from "../utils/reminderFormatters"

const INITIAL_SORT = { id: "created_at", direction: "desc" as const }

const STATUS_OPTIONS = [
  { value: "SENT", label: "Sent" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export const ReminderHistoryPage: React.FC = () => {
  const { data: reminders = [], isLoading, isError, refetch } = useReminderHistory()

  const [searchTerm, setSearchTerm] = useState("")

  const toolbarFiltered = useMemo(() => {
    return reminders.filter((r) => {
      const term = searchTerm.toLowerCase()
      return (
        r.subject.toLowerCase().includes(term) ||
        r.sent_to.toLowerCase().includes(term) ||
        r.body.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
      )
    })
  }, [reminders, searchTerm])

  const columns = useMemo<ColumnDef<ReminderHistory>[]>(
    () => [
      {
        id: "subject",
        label: "Subject",
        sortable: true,
        filter: { type: "text", placeholder: "Subject…" },
      },
      {
        id: "sent_to",
        label: "Sent to",
        sortable: true,
        filter: { type: "text", placeholder: "Email…" },
      },
      {
        id: "reminder_number",
        label: "Reminder #",
        sortable: true,
        align: "center",
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
        id: "created_at",
        label: "Date",
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
  })

  const hasToolbarFilters = !!searchTerm
  const hasActiveFilters = hasToolbarFilters || table.hasNonDefaultState

  const clearFilters = () => {
    setSearchTerm("")
    table.clearAll()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageBreadcrumb
        items={[
          { label: "Collections", to: "/collections" },
          { label: "Reminder history" },
        ]}
      />

      <PageHeader
        title="Reminder history"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh history
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
            searchPlaceholder="Search by subject, email, or content…"
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
            <TableSkeleton rows={8} columns={5} />
          ) : isError ? (
            <EmptyState
              icon={<Mail className="h-6 w-6 text-destructive" />}
              title="Failed to load reminder logs"
              description="Unable to retrieve dunning reminder history from the server."
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <TableListEmpty
              sourceCount={reminders.length}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No reminders yet"
              emptyDescription="No reminders have been generated or scheduled yet."
              emptyIcon={<Inbox className="h-6 w-6" />}
              noMatchesTitle="No reminders found"
              noMatchesDescription="No reminders match the current filters."
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
                {table.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-[250px] truncate font-medium" title={r.subject}>
                      {r.subject}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                      {r.sent_to}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs tabular-nums">
                      #{r.reminder_number}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={getStatusVariant(REMINDER_STATUS_VARIANT, r.status)}
                        shape="pill"
                        title={getReminderStatusDescription(r.status)}
                      >
                        {getReminderStatusLabel(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {new Date(getReminderDisplayDate(r)).toLocaleString()}
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

export default ReminderHistoryPage
