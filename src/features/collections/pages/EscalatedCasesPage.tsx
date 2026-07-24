import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  useEscalatedCases,
  useReassignCase,
  useCloseCase,
  useOverrideStatus,
} from "../hooks/useCollections"
import type { CollectionCase } from "../types"
import { userService } from "@/features/users/services/userService"
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
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AGING_BUCKET_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { useToast } from "@/components/ui/toast"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import {
  TABLE_PAGE_SIZE,
  shouldShowTableLoading,
  useClientTable,
  useSyncTableQueryBridge,
  useTableQueryBridge,
  useTableUrlState,
  type ColumnDef,
} from "@/lib/table"
import {
  AlertTriangle,
  RefreshCw,
  UserPlus,
  XCircle,
  Settings,
  Eye,
} from "lucide-react"

const INITIAL_SORT = { id: "escalated_at", direction: "desc" as const }
const URL_EXTRA_KEYS = ["q"] as const

export const EscalatedCasesPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

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
    data: cases = [],
    total = 0,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = useEscalatedCases(listParams)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
  })

  const associates = useMemo(() => {
    return allUsers.filter((u) => u.role.role_name === "FINANCE_ASSOCIATE" && u.is_active)
  }, [allUsers])

  const reassignMutation = useReassignCase()
  const closeMutation = useCloseCase()
  const overrideMutation = useOverrideStatus()

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [isReassignOpen, setIsReassignOpen] = useState(false)
  const [isCloseOpen, setIsCloseOpen] = useState(false)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)

  const [targetAssociateId, setTargetAssociateId] = useState("")
  const [targetStatus, setTargetStatus] = useState("")

  const columns = useMemo<ColumnDef<CollectionCase>[]>(
    () => [
      {
        id: "customer_name",
        label: "Customer",
        sortable: true,
        accessor: (row) => row.customer?.customer_name ?? "Active client",
        filter: { type: "text", placeholder: "Customer…" },
      },
      {
        id: "invoice_number",
        label: "Invoice",
        sortable: true,
        accessor: (row) => row.invoice?.invoice_number ?? "INV-N/A",
        filter: { type: "text", placeholder: "Invoice…" },
      },
      {
        id: "outstanding_amount",
        label: "Outstanding",
        sortable: true,
        align: "right",
        defaultSortDirection: "desc",
        accessor: (row) => row.invoice?.outstanding_amount ?? row.outstanding_amount_snapshot,
        filter: { type: "number-range" },
      },
      {
        id: "aging_bucket",
        label: "Bucket",
        sortable: true,
        align: "center",
        filter: { type: "text", placeholder: "Bucket…" },
      },
      {
        id: "escalated_at",
        label: "Escalated at",
        sortable: true,
        align: "center",
        defaultSortDirection: "desc",
        accessor: (row) => row.escalated_at ?? row.updated_at,
        filter: { type: "date-range" },
      },
      {
        id: "assigned_associate_name",
        label: "Associate",
        sortable: true,
        accessor: (row) => row.assigned_associate_name ?? "",
        filter: { type: "text", placeholder: "Associate…" },
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
    data: cases,
    columns,
    initialSort: INITIAL_SORT,
    pageSize: TABLE_PAGE_SIZE,
    paginationMode: bridge.paginationMode,
    serverTotal: total,
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

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCaseId || !targetAssociateId) return

    reassignMutation.mutate(
      { caseId: selectedCaseId, associateId: targetAssociateId },
      {
        onSuccess: () => {
          setIsReassignOpen(false)
          setSelectedCaseId(null)
          setTargetAssociateId("")
          toast({
            title: "Case reassigned",
            description: "The case has been reassigned to the selected associate.",
            type: "success",
          })
        },
        onError: () => {
          toast({
            title: "Reassignment failed",
            description: "There was an error reassigning this case.",
            type: "error",
          })
        },
      }
    )
  }

  const handleCloseSubmit = () => {
    if (!selectedCaseId) return

    closeMutation.mutate(selectedCaseId, {
      onSuccess: () => {
        setIsCloseOpen(false)
        setSelectedCaseId(null)
        toast({
          title: "Case closed",
          description: "The collection case has been manually closed.",
          type: "success",
        })
      },
      onError: () => {
        toast({
          title: "Failed to close case",
          description: "There was an error closing this case.",
          type: "error",
        })
      },
    })
  }

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCaseId || !targetStatus) return

    overrideMutation.mutate(
      { caseId: selectedCaseId, newStatus: targetStatus },
      {
        onSuccess: () => {
          setIsOverrideOpen(false)
          setSelectedCaseId(null)
          setTargetStatus("")
          toast({
            title: "Status overridden",
            description: "The collection status has been overridden successfully.",
            type: "success",
          })
        },
        onError: () => {
          toast({
            title: "Override failed",
            description: "There was an error overriding the collection status.",
            type: "error",
          })
        },
      }
    )
  }

  const closeDialog = (setter: (open: boolean) => void) => {
    setter(false)
    setSelectedCaseId(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageBreadcrumb
        items={[
          { label: "Collections", to: "/collections" },
          { label: "Escalated cases" },
        ]}
      />

      <PageHeader
        title="Escalated cases"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh list
          </Button>
        }
      />

      <Card className="border-t-2 border-t-destructive/40">
        <div className="space-y-2 border-b border-border p-3">
          <FilterBar
            variant="toolbar"
            size="sm"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search escalated cases by customer or invoice…"
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
            <TableSkeleton rows={8} columns={7} />
          ) : isError ? (
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
              title="Failed to load escalated cases"
              description="Ensure you have manager permissions and the API is online."
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <TableListEmpty
              sourceCount={total}
              filteredCount={table.filteredRows.length}
              hasActiveFilters={hasActiveFilters}
              emptyTitle="No escalated cases"
              emptyDescription="No collection cases are currently in escalated state."
              emptyIcon={<AlertTriangle className="h-6 w-6 text-success" />}
              noMatchesTitle="No escalated cases found"
              noMatchesDescription="No escalated cases match the current filters."
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
                {table.rows.map((c) => {
                  const outstanding =
                    c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-[150px] truncate font-medium">
                        {c.customer?.customer_name || "Active client"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.invoice?.invoice_number || "INV-N/A"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusVariant(AGING_BUCKET_VARIANT, c.aging_bucket)}
                          shape="pill"
                        >
                          {c.aging_bucket}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-destructive">
                        {c.escalated_at
                          ? new Date(c.escalated_at).toLocaleString()
                          : new Date(c.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.assigned_associate_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/collections/${c.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            Details
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedCaseId(c.id)
                              setTargetAssociateId(c.assigned_to || "")
                              setIsReassignOpen(true)
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5" aria-hidden />
                            Reassign
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-warning"
                            onClick={() => {
                              setSelectedCaseId(c.id)
                              setTargetStatus(c.status)
                              setIsOverrideOpen(true)
                            }}
                          >
                            <Settings className="h-3.5 w-3.5" aria-hidden />
                            Override
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedCaseId(c.id)
                              setIsCloseOpen(true)
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" aria-hidden />
                            Close
                          </Button>
                        </div>
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

      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign collection case</DialogTitle>
            <DialogDescription>
              Assign this escalated case to another active Finance Associate.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="escalated-reassign-associate">Select associate</Label>
              <Select
                id="escalated-reassign-associate"
                value={targetAssociateId}
                onChange={(e) => setTargetAssociateId(e.target.value)}
                required
              >
                <option value="">Choose associate…</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.first_name} {a.last_name} ({a.email})
                  </option>
                ))}
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => closeDialog(setIsReassignOpen)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={reassignMutation.isPending}>
                Confirm reassignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override case status</DialogTitle>
            <DialogDescription>
              Manually set the collections workflow status. This overrides automated triggers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="escalated-override-status">New status</Label>
              <Select
                id="escalated-override-status"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                required
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="PROMISED">Promised</option>
                <option value="ESCALATED">Escalated</option>
                <option value="DISPUTED">Disputed</option>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => closeDialog(setIsOverrideOpen)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="border-warning/30 bg-warning-muted text-warning"
                loading={overrideMutation.isPending}
              >
                Override status
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden />
              Close collection case
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to close this case manually? Closing indicates resolving all
              outstanding billing disputes or payment settlements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => closeDialog(setIsCloseOpen)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={closeMutation.isPending}
              onClick={handleCloseSubmit}
            >
              Yes, close case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EscalatedCasesPage
