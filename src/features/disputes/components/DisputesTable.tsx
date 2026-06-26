import React, { useState, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Dispute } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb, type BreadcrumbItem } from "@/components/ui/page-breadcrumb"
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
import { SLAProgress } from "./SLAProgress"
import { isTerminalDisputeStatus } from "../utils/disputeFormatters"
import {
  DISPUTE_STATUS_VARIANT,
  PRIORITY_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { FolderOpen, ArrowUpDown, RefreshCw } from "lucide-react"

interface DisputesTableProps {
  disputes: Dispute[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  title: string
  breadcrumbItems?: BreadcrumbItem[]
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
  disputes,
  isLoading,
  isError,
  refetch,
  title,
  breadcrumbItems,
}) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [invoiceFilter, setInvoiceFilter] = useState("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [assigneeFilter, setAssigneeFilter] = useState("")

  React.useEffect(() => {
    const slaParam = searchParams.get("sla")
    if (slaParam === "breached") {
      setStatusFilter("")
    }
  }, [searchParams])

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

  const filterOptions = useMemo(() => {
    const categories = new Set<string>()
    const invoices = new Set<string>()
    const customers = new Set<string>()
    const assignees = new Set<string>()

    disputes.forEach((d) => {
      if (d.dispute_category) categories.add(d.dispute_category)
      if (d.invoice_number) invoices.add(d.invoice_number)
      if (d.customer?.customer_name) customers.add(d.customer.customer_name)
      if (d.assigned_user_name) assignees.add(d.assigned_user_name)
    })

    return {
      categories: Array.from(categories).sort(),
      invoices: Array.from(invoices).sort(),
      customers: Array.from(customers).sort(),
      assignees: Array.from(assignees).sort(),
    }
  }, [disputes])

  const filteredDisputes = useMemo(() => {
    const slaParam = searchParams.get("sla")
    const teamParam = searchParams.get("team")

    return disputes
      .filter((d) => {
        const term = searchTerm.toLowerCase()
        const matchesSearch =
          d.dispute_number.toLowerCase().includes(term) ||
          d.invoice_number.toLowerCase().includes(term) ||
          (d.customer?.customer_name || "").toLowerCase().includes(term)

        const matchesStatus = !statusFilter || d.status === statusFilter
        const matchesCategory = !categoryFilter || d.dispute_category === categoryFilter
        const matchesInvoice = !invoiceFilter || d.invoice_number === invoiceFilter
        const matchesCustomer = !customerFilter || d.customer?.customer_name === customerFilter
        const matchesAssignee = !assigneeFilter || d.assigned_user_name === assigneeFilter
        const matchesSlaParam = slaParam !== "breached" || d.sla?.status === "BREACHED"
        const matchesTeamParam = teamParam !== "true" || !!d.assigned_to

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory &&
          matchesInvoice &&
          matchesCustomer &&
          matchesAssignee &&
          matchesSlaParam &&
          matchesTeamParam
        )
      })
      .sort((a, b) => {
        let aVal: unknown = a[sortField as keyof typeof a]
        let bVal: unknown = b[sortField as keyof typeof b]

        if (sortField === "sla_percentage") {
          aVal = a.sla?.current_percentage ?? 0
          bVal = b.sla?.current_percentage ?? 0
        }

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
  }, [
    disputes,
    searchTerm,
    statusFilter,
    categoryFilter,
    invoiceFilter,
    customerFilter,
    assigneeFilter,
    searchParams,
    sortField,
    sortDirection,
  ])

  const totalItems = filteredDisputes.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDisputes = filteredDisputes.slice(startIndex, startIndex + itemsPerPage)

  const hasActiveFilters =
    !!searchTerm ||
    !!statusFilter ||
    !!categoryFilter ||
    !!invoiceFilter ||
    !!customerFilter ||
    !!assigneeFilter

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setCategoryFilter("")
    setInvoiceFilter("")
    setCustomerFilter("")
    setAssigneeFilter("")
    setCurrentPage(1)
  }

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
        <CardContent className="space-y-4 p-4">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value)
              setCurrentPage(1)
            }}
            searchPlaceholder="Search by dispute ID, invoice, or customer…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="filter-category">Category</Label>
              <Select
                id="filter-category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-status">Status</Label>
              <Select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_REVIEW">In review</option>
                <option value="WAITING_CUSTOMER">Waiting customer</option>
                <option value="WAITING_INTERNAL">Waiting internal</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-invoice">Invoice</Label>
              <Select
                id="filter-invoice"
                value={invoiceFilter}
                onChange={(e) => {
                  setInvoiceFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All invoices</option>
                {filterOptions.invoices.map((inv) => (
                  <option key={inv} value={inv}>
                    {inv}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-customer">Customer</Label>
              <Select
                id="filter-customer"
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All customers</option>
                {filterOptions.customers.map((cust) => (
                  <option key={cust} value={cust}>
                    {cust}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-assignee">Assignee</Label>
              <Select
                id="filter-assignee"
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All assignees</option>
                {filterOptions.assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
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
          ) : paginatedDisputes.length === 0 ? (
            <EmptyState
              title="No disputes found"
              description="No active disputes match the current filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort("dispute_number")}
                      aria-sort={getSortAria("dispute_number")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Dispute number
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead className="w-40">
                    <button
                      type="button"
                      onClick={() => handleSort("sla_percentage")}
                      aria-sort={getSortAria("sla_percentage")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      SLA status
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead>Assigned to</TableHead>
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
                {paginatedDisputes.map((d) => {
                  const priorityKey = getPriorityKey(d)
                  return (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/disputes/${d.id}`)}
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
