import React, { useState } from "react"
import { Invoice } from "../types/invoiceUpload.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { INVOICE_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { FileSpreadsheet } from "lucide-react"

interface InvoiceTableProps {
  invoices: Invoice[] | undefined
  isLoading: boolean
  isError: boolean
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  isLoading,
  isError,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold">Successfully imported invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <TableSkeleton rows={6} columns={7} />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            title="Failed to load invoices"
            description="Verify connection to the AR database service."
            className="py-8"
          />
        </CardContent>
      </Card>
    )
  }

  const list = invoices || []
  const totalItems = list.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvoices = list.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-semibold">Successfully imported invoices</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {totalItems === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet className="h-6 w-6" />}
            title="No invoices imported yet"
            description="Invoices will appear here once extraction completes successfully."
            className="py-10"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice date</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Total amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-foreground">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">Active customer</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inv.invoice_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(INVOICE_STATUS_VARIANT, inv.status)}
                        shape="pill"
                      >
                        {inv.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {inv.currency}{" "}
                      {inv.outstanding_amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-foreground">
                      {inv.currency}{" "}
                      {inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="border-t border-border px-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  pageSize={itemsPerPage}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
