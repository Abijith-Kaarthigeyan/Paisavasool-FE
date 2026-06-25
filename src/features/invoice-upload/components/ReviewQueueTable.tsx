import React from "react"
import { ReviewQueueItem } from "../types/invoiceUpload.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { INVOICE_REVIEW_REASON_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { AlertTriangle, Clock } from "lucide-react"

interface ReviewQueueTableProps {
  items: ReviewQueueItem[] | undefined
  isLoading: boolean
  isError: boolean
}

export const ReviewQueueTable: React.FC<ReviewQueueTableProps> = ({
  items,
  isLoading,
  isError,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
            Invoices requiring manual review
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <TableSkeleton rows={4} columns={4} />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            title="Failed to load review queue"
            description="Could not retrieve items requiring manual review."
            className="py-8"
          />
        </CardContent>
      </Card>
    )
  }

  const list = items || []

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
          Invoices requiring manual review
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {list.length === 0 ? (
          <EmptyState
            title="No review items"
            description="No files requiring review in this batch."
            className="py-8"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice record</TableHead>
                <TableHead>Review reason</TableHead>
                <TableHead>Queue status</TableHead>
                <TableHead>Discovered at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">Flagged invoice</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(
                        INVOICE_REVIEW_REASON_VARIANT,
                        item.review_reason
                      )}
                      shape="pill"
                    >
                      {item.review_reason.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" shape="pill">
                      <Clock className="mr-1 h-3 w-3" aria-hidden />
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
