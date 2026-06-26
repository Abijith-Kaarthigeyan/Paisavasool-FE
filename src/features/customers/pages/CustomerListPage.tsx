import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCustomers } from "../hooks/useCustomers"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterBar } from "@/components/ui/filter-bar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RefreshCw, HelpCircle, Inbox } from "lucide-react"

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 10

  const {
    data: customers = [],
    isLoading,
    isError,
    refetch,
  } = useCustomers()

  const handleRowClick = (customerId: string) => {
    navigate(`/customers/${customerId}`)
  }

  const filteredCustomers = customers.filter((cust) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    return (
      cust.customer_name.toLowerCase().includes(term) ||
      cust.customer_code.toLowerCase().includes(term) ||
      (cust.email && cust.email.toLowerCase().includes(term))
    )
  })

  const totalItems = filteredCustomers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customers directory"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh directory
          </Button>
        }
      />

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value)
          setCurrentPage(1)
        }}
        searchPlaceholder="Search by name, customer code, or email…"
      >
        <span className="text-sm text-muted-foreground">
          Total customers:{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {filteredCustomers.length}
          </span>
        </span>
      </FilterBar>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} columns={5} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load customers"
              description="Verify the Accounts Receivable database backend service is active and responsive."
              action={
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Retry fetch
                </Button>
              }
            />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No customers found"
              description="No customers match the search criteria."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Billing address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((cust) => (
                  <TableRow
                    key={cust.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(cust.id)}
                  >
                    <TableCell className="font-medium text-primary">
                      {cust.customer_code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {cust.customer_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cust.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cust.phone || "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {cust.billing_address || "—"}
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

export default CustomerListPage
