import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CollectionCase } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb, type BreadcrumbItem } from "@/components/ui/page-breadcrumb"
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AGING_BUCKET_VARIANT,
  PRIORITY_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { formatCurrency } from "@/lib/formatCurrency"
import { ArrowUpDown, FolderOpen, RefreshCw } from "lucide-react"

export interface CollectionsCasesTableProps {
  cases: CollectionCase[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  title: string
  showAssignedColumn?: boolean
  filterMode?: "full" | "basic"
  breadcrumbItems?: BreadcrumbItem[]
}

export const CollectionsCasesTable: React.FC<CollectionsCasesTableProps> = ({
  cases,
  isLoading,
  isError,
  refetch,
  title,
  showAssignedColumn = true,
  filterMode = "full",
  breadcrumbItems,
}) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [bucketFilter, setBucketFilter] = useState(searchParams.get("bucket") || "")
  const [customerFilter, setCustomerFilter] = useState("")
  const [associateFilter, setAssociateFilter] = useState("")

  const [sortField, setSortField] = useState("opened_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const bucket = searchParams.get("bucket")
    if (bucket) {
      setBucketFilter(bucket)
      setCurrentPage(1)
    }
  }, [searchParams])

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
    const customers = new Set<string>()
    const associates = new Set<string>()
    cases.forEach((c) => {
      if (c.customer?.customer_name) customers.add(c.customer.customer_name)
      if (c.assigned_associate_name) associates.add(c.assigned_associate_name)
    })
    return {
      customers: Array.from(customers).sort(),
      associates: Array.from(associates).sort(),
    }
  }, [cases])

  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        const term = searchTerm.toLowerCase()
        const matchesSearch =
          c.id.toLowerCase().includes(term) ||
          (c.customer?.customer_name || "").toLowerCase().includes(term) ||
          (c.invoice?.invoice_number || "").toLowerCase().includes(term)

        const matchesPriority = !priorityFilter || c.priority === priorityFilter
        const matchesBucket = !bucketFilter || c.aging_bucket === bucketFilter
        const matchesCustomer =
          filterMode !== "full" || !customerFilter || c.customer?.customer_name === customerFilter
        const matchesAssociate =
          filterMode !== "full" ||
          !associateFilter ||
          c.assigned_associate_name === associateFilter

        return (
          matchesSearch &&
          matchesPriority &&
          matchesBucket &&
          matchesCustomer &&
          matchesAssociate
        )
      })
      .sort((a, b) => {
        let aVal: unknown
        let bVal: unknown

        if (sortField === "invoice_number") {
          aVal = a.invoice?.invoice_number || ""
          bVal = b.invoice?.invoice_number || ""
        } else if (sortField === "customer_name") {
          aVal = a.customer?.customer_name || ""
          bVal = b.customer?.customer_name || ""
        } else if (sortField === "outstanding_amount") {
          aVal = a.invoice?.outstanding_amount ?? a.outstanding_amount_snapshot
          bVal = b.invoice?.outstanding_amount ?? b.outstanding_amount_snapshot
        } else {
          aVal = a[sortField as keyof CollectionCase]
          bVal = b[sortField as keyof CollectionCase]
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
    cases,
    searchTerm,
    priorityFilter,
    bucketFilter,
    customerFilter,
    associateFilter,
    filterMode,
    sortField,
    sortDirection,
  ])

  const totalItems = filteredCases.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage)

  const hasActiveFilters =
    !!searchTerm ||
    !!priorityFilter ||
    !!bucketFilter ||
    (filterMode === "full" && (!!customerFilter || !!associateFilter))

  const clearFilters = () => {
    setSearchTerm("")
    setPriorityFilter("")
    setBucketFilter("")
    setCustomerFilter("")
    setAssociateFilter("")
    setCurrentPage(1)
  }

  const breadcrumb = breadcrumbItems ?? [
    { label: "Collections", to: "/collections" },
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
        <div className="border-b border-border p-3">
          <FilterBar
            variant="toolbar"
            size="sm"
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value)
              setCurrentPage(1)
            }}
            searchPlaceholder="Search by case ID, customer, or invoice…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
          >
            <FilterSelect
              id="filter-priority"
              aria-label="Priority"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </FilterSelect>
            {filterMode === "full" && (
              <>
                <FilterSelect
                  id="filter-bucket"
                  aria-label="Aging bucket"
                  value={bucketFilter}
                  onChange={(e) => {
                    setBucketFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="">All buckets</option>
                  <option value="CURRENT">Current</option>
                  <option value="0-30">0–30 days</option>
                  <option value="31-60">31–60 days</option>
                  <option value="61-90">61–90 days</option>
                  <option value="90_PLUS">90+ days</option>
                </FilterSelect>
                <FilterSelect
                  id="filter-customer"
                  aria-label="Customer"
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
                </FilterSelect>
                <FilterSelect
                  id="filter-associate"
                  aria-label="Assigned associate"
                  value={associateFilter}
                  onChange={(e) => {
                    setAssociateFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="">All associates</option>
                  {filterOptions.associates.map((assoc) => (
                    <option key={assoc} value={assoc}>
                      {assoc}
                    </option>
                  ))}
                </FilterSelect>
              </>
            )}
          </FilterBar>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={8} columns={showAssignedColumn ? 7 : 6} />
          ) : isError ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6 text-destructive" />}
              title="Failed to load collection cases"
              description="Unable to retrieve cases from the server."
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : paginatedCases.length === 0 ? (
            <EmptyState
              title="No cases found"
              description="No collection cases match the current filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort("invoice_number")}
                      aria-sort={getSortAria("invoice_number")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Invoice
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort("customer_name")}
                      aria-sort={getSortAria("customer_name")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Customer
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("outstanding_amount")}
                      aria-sort={getSortAria("outstanding_amount")}
                      className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Outstanding
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Bucket</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  {showAssignedColumn && <TableHead>Assigned to</TableHead>}
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("opened_at")}
                      aria-sort={getSortAria("opened_at")}
                      className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Opened
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCases.map((c) => {
                  const outstanding =
                    c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/collections/${c.id}`)}
                    >
                      <TableCell className="font-medium">
                        {c.invoice?.invoice_number || "INV-N/A"}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">
                        {c.customer?.customer_name || "Active client"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(outstanding)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusVariant(AGING_BUCKET_VARIANT, c.aging_bucket)}
                          shape="pill"
                        >
                          {c.aging_bucket}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusVariant(PRIORITY_VARIANT, c.priority)}
                          shape="pill"
                        >
                          {c.priority}
                        </Badge>
                      </TableCell>
                      {showAssignedColumn && (
                        <TableCell className="text-muted-foreground">
                          {c.assigned_associate_name}
                        </TableCell>
                      )}
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {new Date(c.opened_at).toLocaleDateString()}
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
