import React, { useMemo, useState } from "react"
import { useReminderHistory } from "../hooks/useCollections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { FilterBar } from "@/components/ui/filter-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { REMINDER_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { ArrowUpDown, Mail, RefreshCw } from "lucide-react"

export const ReminderHistoryPage: React.FC = () => {
  const { data: reminders = [], isLoading, isError, refetch } = useReminderHistory()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const filteredReminders = useMemo(() => {
    return reminders
      .filter((r) => {
        const term = searchTerm.toLowerCase()
        const matchesSearch =
          r.subject.toLowerCase().includes(term) ||
          r.sent_to.toLowerCase().includes(term) ||
          r.body.toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term)

        const matchesStatus = !statusFilter || r.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      })
  }, [reminders, searchTerm, statusFilter, sortDirection])

  const totalItems = filteredReminders.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedReminders = filteredReminders.slice(startIndex, startIndex + itemsPerPage)

  const hasActiveFilters = !!searchTerm || !!statusFilter

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setCurrentPage(1)
  }

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Reminder history"
        description="Browse dunning dispatches, check letter status, and view alert subject lines."
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh history
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value)
              setCurrentPage(1)
            }}
            searchPlaceholder="Search by subject, email, or content…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
          />
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="filter-reminder-status">Status</Label>
            <Select
              id="filter-reminder-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">All statuses</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
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
          ) : paginatedReminders.length === 0 ? (
            <EmptyState
              title="No reminders found"
              description="No reminders have been generated or scheduled yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sent to</TableHead>
                  <TableHead className="text-center">Reminder #</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={toggleSortDirection}
                      aria-sort={sortDirection === "asc" ? "ascending" : "descending"}
                      className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Generated date
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReminders.map((r) => (
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
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={itemsPerPage}
        />
      )}
    </div>
  )
}

export default ReminderHistoryPage
