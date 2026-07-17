import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePurchaseOrders } from "../hooks/usePurchaseOrders"
import { useCustomers } from "@/features/customers/hooks/useCustomers"
import { Card, CardContent } from "@/components/ui/card"
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
import { formatCurrency } from "@/lib/formatCurrency"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import { RefreshCw, HelpCircle, ClipboardList } from "lucide-react"
import { PurchaseOrderStatusBadge } from "../components/PurchaseOrderStatusBadge"
import { BillingsListToggle } from "@/features/invoices/components/BillingsListToggle"

export const PurchaseOrderListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const debouncedSearch = useDebouncedValue(searchTerm)

  const listParams = useMemo(
    () => ({
      limit: 500,
      offset: 0,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(customerFilter ? { customer_id: customerFilter } : {}),
    }),
    [debouncedSearch, statusFilter, customerFilter]
  )

  const {
    data: purchaseOrders = [],
    isLoading,
    isError,
    refetch,
  } = usePurchaseOrders(listParams)

  const { data: customers = [] } = useCustomers({ limit: 500 })

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter, customerFilter])

  const totalItems = purchaseOrders.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = purchaseOrders.slice(startIndex, startIndex + itemsPerPage)

  const totalPoValue = purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0)

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
          { label: "Billings", to: "/invoices" },
          { label: "Purchase orders" },
        ]}
      />

      <div className="space-y-3">
        <PageHeader
          title="Billings"
          actions={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh list
            </Button>
          }
        />

        <BillingsListToggle active="purchase-orders" />
      </div>

      <Card>
        <div className="border-b border-border p-3">
          <FilterBar
            variant="toolbar"
            size="sm"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by PO number or customer…"
            showClear={hasActiveFilters}
            onClear={clearFilters}
            footer={
              <>
                Total PO value:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(totalPoValue)}
                </span>
              </>
            }
          >
            <FilterSelect
              id="po-status-filter"
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="PARTIALLY_INVOICED">Partially invoiced</option>
              <option value="FULLY_INVOICED">Fully invoiced</option>
            </FilterSelect>
            <FilterSelect
              id="po-customer-filter"
              aria-label="Customer"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option value="">All customers</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.customer_name}
                </option>
              ))}
            </FilterSelect>
          </FilterBar>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} columns={6} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load purchase orders"
              description="Verify the Accounts Receivable database backend service is active and responsive."
              action={
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Retry fetch
                </Button>
              }
            />
          ) : purchaseOrders.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="No purchase orders found"
              description="No purchase orders match the current filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>PO date</TableHead>
                  <TableHead className="text-center">Total amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Linked invoices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((po) => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {po.po_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {po.customer?.customer_name || "Active account"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(po.po_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums text-foreground">
                      {formatCurrency(po.total_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <PurchaseOrderStatusBadge status={po.status} />
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {po.linked_invoice_count > 0 ? po.linked_invoice_count : "—"}
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

export default PurchaseOrderListPage
