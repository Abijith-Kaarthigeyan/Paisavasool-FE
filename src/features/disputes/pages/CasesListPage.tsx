import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useCases } from "../hooks/useDisputes"
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
import { FolderOpen, RefreshCw, ArrowUpDown } from "lucide-react"

export const CasesListPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: cases = [], isLoading, isError, refetch } = useCases()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
    setCurrentPage(1)
  }

  const getSortAria = (field: string): "none" | "ascending" | "descending" => {
    if (sortField !== field) return "none"
    return sortDirection === "asc" ? "ascending" : "descending"
  }

  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        const term = searchTerm.toLowerCase()
        const matchesSearch =
          c.case_number.toLowerCase().includes(term) ||
          c.customer_email.toLowerCase().includes(term) ||
          (c.email_subject || "").toLowerCase().includes(term)
        const matchesStatus = !statusFilter || c.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let aVal: unknown = a[sortField as keyof typeof a]
        let bVal: unknown = b[sortField as keyof typeof b]
        if (aVal === undefined || aVal === null) return 1
        if (bVal === undefined || bVal === null) return -1
        if (typeof aVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(String(bVal))
            : String(bVal).localeCompare(aVal)
        }
        return sortDirection === "asc"
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal)
      })
  }, [cases, searchTerm, statusFilter, sortField, sortDirection])

  const totalItems = filteredCases.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage)

  const hasActiveFilters = !!searchTerm || !!statusFilter

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Intake email cases"
        description="Browse email tickets ingested by the platform and review disputes created by AI analysis."
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh cases
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
            searchPlaceholder="Search by case number, email, or subject…"
            showClear={hasActiveFilters}
            onClear={() => {
              setSearchTerm("")
              setStatusFilter("")
              setCurrentPage(1)
            }}
          />
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="case-status-filter">Status</Label>
            <Select
              id="case-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FAILED">Failed</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={8} columns={6} />
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
          ) : paginatedCases.length === 0 ? (
            <EmptyState
              title="No cases found"
              description="No cases match the current filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort("case_number")}
                      aria-sort={getSortAria("case_number")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Case number
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead>Customer email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Disputes</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("created_at")}
                      aria-sort={getSortAria("created_at")}
                      className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Created
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCases.map((c) => (
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
                    <TableCell className="text-center">
                      <Badge variant={c.status === "OPEN" ? "default" : "outline"} shape="pill">
                        {c.status}
                      </Badge>
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

export default CasesListPage
