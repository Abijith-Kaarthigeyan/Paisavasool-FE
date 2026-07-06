import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useInvoices } from "../hooks/useInvoices"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar"
import { getDashboardPath } from "@/lib/navigation"
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
import { INVOICE_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { formatCurrency } from "@/lib/formatCurrency"
import { RefreshCw, HelpCircle, Inbox } from "lucide-react"
import type { Invoice } from "../types"

const getDisplayStatus = (invoice: Invoice): string => {
  if (invoice.status !== "OVERDUE") {
    return invoice.status
  }
  return invoice.outstanding_amount >= invoice.total_amount
    ? "PENDING"
    : "PARTIALLY_PAID"
}

const matchesStatusFilter = (invoice: Invoice, statusFilter: string): boolean => {
  if (statusFilter === "") return true
  return getDisplayStatus(invoice) === statusFilter
}

export const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    data: invoices = [],
    isLoading,
    isError,
    refetch,
  } = useInvoices()

  const handleRowClick = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`)
  }

  const filterOptions = useMemo(() => {
    const customers = new Set<string>()
    invoices.forEach((inv) => {
      if (inv.customer?.customer_name) customers.add(inv.customer.customer_name)
    })
    return { customers: Array.from(customers).sort() }
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(term) ||
        (inv.customer?.customer_name || "").toLowerCase().includes(term)

      const matchesStatus = matchesStatusFilter(inv, statusFilter)
      const matchesCustomer =
        !customerFilter || inv.customer?.customer_name === customerFilter

      return matchesSearch && matchesStatus && matchesCustomer
    })
  }, [invoices, searchTerm, statusFilter, customerFilter])

  const totalItems = filteredInvoices.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage)

  const totalOpenBalance = filteredInvoices.reduce((sum, i) => sum + i.outstanding_amount, 0)

  const hasActiveFilters = !!searchTerm || !!statusFilter || !!customerFilter

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setCustomerFilter("")
    setCurrentPage(1)
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Billing register" },
        ]}
      />

      <PageHeader
        title="Billing Register"
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
            searchPlaceholder="Search by invoice number or customer…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
            footer={
              <>
                Total open balance:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(totalOpenBalance)}
                </span>
              </>
            }
          >
            <FilterSelect
              id="status-filter"
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="PAID">Paid</option>
              <option value="DISPUTED">Disputed</option>
            </FilterSelect>
            <FilterSelect
              id="customer-filter"
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
          </FilterBar>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} columns={8} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load billing invoices"
              description="Verify the Accounts Receivable database backend service is active and responsive."
              action={
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Retry fetch
                </Button>
              }
            />
          ) : filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No invoices found"
              description="No invoices match the current filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice date</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-center">Total amount</TableHead>
                  <TableHead className="text-center">Outstanding</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((inv) => {
                  const displayStatus = getDisplayStatus(inv)
                  return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(inv.id)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.customer?.customer_name || "Active account"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inv.invoice_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums text-foreground">
                      {formatCurrency(inv.total_amount)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {formatCurrency(inv.outstanding_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={getStatusVariant(INVOICE_STATUS_VARIANT, displayStatus)}
                        shape="pill"
                      >
                        {displayStatus.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {inv.current_version ?? 1}
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

export default InvoiceListPage
