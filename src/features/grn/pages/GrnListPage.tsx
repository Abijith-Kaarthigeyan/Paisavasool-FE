import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGrns } from "../hooks/useGrns"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar"
import { getDashboardPath } from "@/lib/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import { RefreshCw, HelpCircle, PackageCheck } from "lucide-react"
import { BillingsListToggle } from "@/features/invoices/components/BillingsListToggle"
import type { GrnStatus } from "../types"

function grnStatusVariant(status: GrnStatus): "success" | "warning" | "destructive" | "outline" {
  if (status === "LINKED") return "success"
  if (status === "UNLINKED") return "warning"
  if (status === "FAILED") return "destructive"
  return "outline"
}

function truncateNotes(notes: string | null, maxLength = 60): string {
  if (!notes) return "—"
  const trimmed = notes.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}…`
}

export const GrnListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const debouncedSearch = useDebouncedValue(searchTerm)

  const listParams = useMemo(
    () => ({
      limit: 500,
      offset: 0,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [debouncedSearch, statusFilter]
  )

  const {
    data: grns = [],
    isLoading,
    isError,
    refetch,
  } = useGrns(listParams)

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter])

  const totalItems = grns.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGrns = grns.slice(startIndex, startIndex + itemsPerPage)

  const hasActiveFilters = !!searchTerm || !!statusFilter

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setCurrentPage(1)
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Receivables", to: "/invoices" },
          { label: "GRNs" },
        ]}
      />

      <div className="space-y-3">
        <PageHeader
          title="Receivables"
          actions={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh list
            </Button>
          }
        />

        <BillingsListToggle active="grns" />
      </div>

      <Card>
        <div className="border-b border-border p-3">
          <FilterBar
            variant="toolbar"
            size="sm"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by GRN number or PO number…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
          >
            <FilterSelect
              id="grn-status-filter"
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="LINKED">Linked</option>
              <option value="UNLINKED">Unlinked</option>
            </FilterSelect>
          </FilterBar>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} columns={5} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load goods receipt notes"
              description="Verify the Accounts Receivable database backend service is active and responsive."
              action={
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Retry fetch
                </Button>
              }
            />
          ) : grns.length === 0 ? (
            <EmptyState
              icon={<PackageCheck className="h-6 w-6" />}
              title="No goods receipt notes found"
              description="No goods receipt notes match the current filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN number</TableHead>
                  <TableHead>GRN date</TableHead>
                  <TableHead>PO number</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGrns.map((grn) => (
                  <TableRow
                    key={grn.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/grns/${grn.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {grn.grn_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(grn.grn_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {grn.po_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={grnStatusVariant(grn.status)} shape="pill">
                        {grn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-muted-foreground">
                      {truncateNotes(grn.notes)}
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

export default GrnListPage
