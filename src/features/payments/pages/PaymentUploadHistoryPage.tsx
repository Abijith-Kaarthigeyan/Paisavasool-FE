import React from "react"
import { useNavigate } from "react-router-dom"
import { usePaymentUploads } from "../hooks/usePayments"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
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

  return (
    <div className="space-y-8">
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
                {uploads.map((pay) => (
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
                    <TableCell className="text-muted-foreground">Finance Associate</TableCell>
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
    </div>
  )
}

export default PaymentUploadHistoryPage
