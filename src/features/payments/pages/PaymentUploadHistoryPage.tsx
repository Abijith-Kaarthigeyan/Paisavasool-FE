import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePaymentUploads } from "../hooks/usePayments"
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
import { PAYMENT_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { RefreshCw, HelpCircle, Inbox } from "lucide-react"
import { PaymentUploadResponse } from "../types"

export const PaymentUploadHistoryPage: React.FC = () => {
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [uploaderFilter, setUploaderFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    data: uploadsData,
    isLoading,
    isError,
    refetch,
  } = usePaymentUploads(undefined, {
    refetchInterval: 10000,
  })

  const uploads = (uploadsData || []) as PaymentUploadResponse[]

  const handleRowClick = (uploadId: string) => {
    navigate(`/payment-upload/${uploadId}`)
  }

  const filterOptions = useMemo(() => {
    const uploaders = new Set<string>()
    uploads.forEach((pay) => {
      if (pay.uploaded_by) uploaders.add(pay.uploaded_by)
    })
    return { uploaders: Array.from(uploaders).sort() }
  }, [uploads])

  const filteredUploads = useMemo(() => {
    return uploads.filter((pay) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        pay.file_name.toLowerCase().includes(term) ||
        pay.uploaded_by.toLowerCase().includes(term)

      const matchesStatus = !statusFilter || pay.status === statusFilter
      const matchesUploader = !uploaderFilter || pay.uploaded_by === uploaderFilter

      return matchesSearch && matchesStatus && matchesUploader
    })
  }, [uploads, searchTerm, statusFilter, uploaderFilter])

  const totalItems = filteredUploads.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUploads = filteredUploads.slice(startIndex, startIndex + itemsPerPage)

  const hasActiveFilters = !!searchTerm || !!statusFilter || !!uploaderFilter

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setUploaderFilter("")
    setCurrentPage(1)
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Payment history" },
        ]}
      />

      <PageHeader
        title="Payment upload history"
        meta="Auto-refresh enabled"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh list
          </Button>
        }
      />

      <Card>
        {!isLoading && !isError && uploads.length > 0 && (
          <div className="border-b border-border p-3">
            <FilterBar
              variant="toolbar"
              size="sm"
              searchValue={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value)
                setCurrentPage(1)
              }}
              searchPlaceholder="Search by file name or uploader…"
              showClear={hasActiveFilters}
              onClear={clearFilters}
            >
              <FilterSelect
                id="filter-status"
                aria-label="Ingestion status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All statuses</option>
                <option value="UPLOADED">Uploaded</option>
                <option value="PROCESSING">Processing</option>
                <option value="MATCHED">Matched</option>
                <option value="REVIEW_REQUIRED">Review required</option>
                <option value="FAILED">Failed</option>
              </FilterSelect>
              <FilterSelect
                id="filter-uploader"
                aria-label="Uploaded by"
                value={uploaderFilter}
                onChange={(e) => {
                  setUploaderFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All uploaders</option>
                {filterOptions.uploaders.map((uploader) => (
                  <option key={uploader} value={uploader}>
                    {uploader}
                  </option>
                ))}
              </FilterSelect>
            </FilterBar>
          </div>
        )}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={4} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load history"
              description="Unable to retrieve the list of payment uploads. Please check the backend connectivity."
              action={
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Try again
                </Button>
              }
            />
          ) : uploads.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No payment uploads yet"
              description="No payment documents have been uploaded yet."
            />
          ) : filteredUploads.length === 0 ? (
            <EmptyState
              title="No uploads found"
              description="No payment uploads match the current filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File name</TableHead>
                  <TableHead>Uploaded at</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead className="text-right">Ingestion status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUploads.map((pay) => (
                  <TableRow
                    key={pay.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(pay.id)}
                  >
                    <TableCell
                      className="max-w-[280px] truncate font-medium text-foreground"
                      title={pay.file_name}
                    >
                      {pay.file_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(pay.uploaded_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{pay.uploaded_by}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={getStatusVariant(PAYMENT_STATUS_VARIANT, pay.status)}
                        shape="pill"
                      >
                        {pay.status.replace(/_/g, " ")}
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

export default PaymentUploadHistoryPage
