import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useInvoices } from "../hooks/useInvoices"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
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
import { INVOICE_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { RefreshCw, HelpCircle, Inbox } from "lucide-react"

export const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
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

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === "") return true
    return inv.status === statusFilter
  })

  const totalItems = filteredInvoices.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage)

  const currencySymbol = invoices[0]?.currency || "INR"
  const totalOpenBalance = filteredInvoices.reduce((sum, i) => sum + i.outstanding_amount, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing Register"
        description="Browse corporate invoices, track outstanding balances, and check dispute indicators."
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh list
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-xs space-y-1.5">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">All invoices</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DISPUTED">Disputed</option>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Total open balance:{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {currencySymbol}{" "}
              {totalOpenBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} columns={7} />
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
              description="No invoices match the selected status."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice date</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Total amount</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((inv) => (
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
                    <TableCell className="text-right font-medium tabular-nums text-foreground">
                      {inv.currency}{" "}
                      {inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {inv.currency}{" "}
                      {inv.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={getStatusVariant(INVOICE_STATUS_VARIANT, inv.status)}
                        shape="pill"
                      >
                        {inv.status.replace(/_/g, " ")}
                      </Badge>
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

export default InvoiceListPage
