import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { buildDisputeDetailPath } from "../utils/disputeBreadcrumbs"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { useDisputes, useReassignDispute } from "../hooks/useDisputes"
import { userService } from "@/features/users/services/userService"
import type { Dispute } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton, Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { FilterBar } from "@/components/ui/filter-bar"
import { ActiveFilterChips } from "@/components/ui/active-filter-chips"
import { MobileColumnFilters } from "@/components/ui/mobile-column-filters"
import { SortableHeader } from "@/components/ui/sortable-header"
import { TableListEmpty } from "@/components/ui/table-list-empty"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { isEscalatedDispute } from "../utils/disputeFormatters"
import { useClientTable, TABLE_PAGE_SIZE, CLIENT_FETCH_CAP, type ColumnDef } from "@/lib/table"
import { FolderOpen, Inbox, RefreshCw, UserMinus } from "lucide-react"

const INITIAL_SORT = { id: "escalated", direction: "desc" as const }

export const EscalatedDisputesPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useSelector((state: RootState) => state.auth)
  const isManager = user?.role === "FINANCE_MANAGER" || user?.role === "ADMIN"
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes({
    limit: CLIENT_FETCH_CAP,
  })
  const reassignMutation = useReassignDispute()

  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null)
  const [selectedDisputeNum, setSelectedDisputeNum] = useState<string | null>(null)
  const [assigneeId, setAssigneeId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
  })

  const associates = useMemo(() => {
    return users.filter((u) => u.role?.role_name === "FINANCE_ASSOCIATE")
  }, [users])

  const escalatedDisputes = useMemo(
    () => disputes.filter(isEscalatedDispute),
    [disputes]
  )

  const toolbarFiltered = useMemo(() => {
    if (!searchTerm.trim()) return escalatedDisputes
    const term = searchTerm.toLowerCase()
    return escalatedDisputes.filter(
      (d) =>
        d.dispute_number.toLowerCase().includes(term) ||
        (d.dispute_category || "").toLowerCase().includes(term)
    )
  }, [escalatedDisputes, searchTerm])

  const columns = useMemo<ColumnDef<Dispute>[]>(
    () => [
      {
        id: "dispute_number",
        label: "Dispute number",
        sortable: true,
        filter: { type: "text", placeholder: "Dispute number…" },
      },
      {
        id: "dispute_category",
        label: "Category",
        sortable: true,
        filter: { type: "text", placeholder: "Category…" },
      },
      {
        id: "level",
        label: "Level",
        sortable: true,
        align: "center",
        accessor: () => 1,
        filter: { type: "number-range" },
      },
      {
        id: "manager_name",
        label: "Manager",
        sortable: true,
        accessor: (row) => row.manager_name ?? "Finance manager",
        filter: { type: "text", placeholder: "Manager…" },
      },
      {
        id: "sla_status",
        label: "SLA",
        sortable: true,
        align: "center",
        accessor: (row) => row.sla?.status ?? "Breached",
        filter: { type: "text", placeholder: "SLA status…" },
      },
      {
        id: "escalated",
        label: "Escalated",
        sortable: true,
        align: "center",
        defaultSortDirection: "desc",
        accessor: (row) => row.sla?.paused_at ?? row.created_at,
        filter: { type: "date-range" },
      },
      {
        id: "actions",
        label: "Actions",
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

  const handleOpenReassign = (e: React.MouseEvent, id: string, num: string) => {
    e.stopPropagation()
    setSelectedDisputeId(id)
    setSelectedDisputeNum(num)
    setAssigneeId("")
  }

  const handleConfirmReassign = async () => {
    if (!selectedDisputeId || !assigneeId) return

    try {
      await reassignMutation.mutateAsync({
        id: selectedDisputeId,
        assignedTo: assigneeId,
      })

      toast({
        title: "Dispute Reassigned",
        description: `Dispute ${selectedDisputeNum} reassigned successfully.`,
        type: "success",
      })

      setSelectedDisputeId(null)
      setSelectedDisputeNum(null)
    } catch {
      toast({
        title: "Reassignment Failed",
        description: "An error occurred while reassigning the dispute.",
        type: "error",
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageBreadcrumb
        items={[
          { label: "Disputes", to: "/disputes" },
          { label: "Escalated disputes" },
        ]}
      />

      <PageHeader
        title="Escalated disputes"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh queue
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
            searchPlaceholder="Search by dispute number or category…"
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
            <TableSkeleton rows={8} columns={7} />
          ) : isError ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6 text-destructive" />}
              title="Failed to load escalated queue"
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <TableListEmpty
              sourceCount={escalatedDisputes.length}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No escalated disputes"
              emptyDescription="No active SLA breaches or escalated disputes at this time."
              emptyIcon={<Inbox className="h-6 w-6" />}
              noMatchesTitle="No disputes found"
              noMatchesDescription="No escalated disputes match the current filters."
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
                        buildDisputeDetailPath(d.id, { path: "/disputes/escalated" })
                      )
                    }
                  >
                    <TableCell className="font-medium text-primary">
                      {d.dispute_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.dispute_category}</TableCell>
                    <TableCell className="text-center font-medium">Level 1</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.manager_name || "Finance manager"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive" shape="pill">
                        {d.sla?.status || "Breached"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {d.sla?.paused_at
                        ? new Date(d.sla.paused_at).toLocaleDateString()
                        : new Date(d.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {isManager && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleOpenReassign(e, d.id, d.dispute_number)}
                        >
                          <UserMinus className="h-3 w-3" aria-hidden />
                          Reassign
                        </Button>
                      )}
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

      <Dialog
        open={selectedDisputeId !== null}
        onOpenChange={(open) => !open && setSelectedDisputeId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign dispute {selectedDisputeNum}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reassign-associate">Finance associate</Label>
              {isUsersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  id="reassign-associate"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">Choose associate…</option>
                  {associates.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name} ({a.email})
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedDisputeId(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReassign}
              disabled={!assigneeId}
              loading={reassignMutation.isPending}
            >
              Confirm reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EscalatedDisputesPage
