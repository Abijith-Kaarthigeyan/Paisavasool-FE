import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useDisputes } from "../hooks/useDisputes"
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
import { RefreshCw, FolderOpen, ArrowRight, PauseCircle } from "lucide-react"

export const WaitingCustomerPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes()

  const waitingDisputes = useMemo(() => {
    return disputes.filter((d) => d.status === "WAITING_CUSTOMER")
  }, [disputes])

  const disputesEnriched = useMemo(() => {
    return waitingDisputes.map((d) => {
      const updatedDate = new Date(d.updated_at).getTime()
      const now = Date.now()
      const diffTime = Math.abs(now - updatedDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1

      return {
        ...d,
        daysWaiting: diffDays,
        latestMessage: "Please provide tax exemption certificate proof…",
      }
    })
  }, [waitingDisputes])

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Waiting for customer"
        description="Disputes blocked pending billing documents, details, or confirmations from the client."
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
            <TableSkeleton rows={6} columns={7} />
          ) : isError ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6 text-destructive" />}
              title="Failed to load disputes"
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : disputesEnriched.length === 0 ? (
            <EmptyState
              title="No pending customer responses"
              description="No disputes are currently waiting on customer input."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer email</TableHead>
                  <TableHead className="text-center">Days waiting</TableHead>
                  <TableHead>Latest message</TableHead>
                  <TableHead className="text-center">SLA</TableHead>
                  <TableHead className="text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputesEnriched.map((d) => (
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
                      {d.customer?.email || "billing@client.com"}
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums">
                      {d.daysWaiting} days
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate text-muted-foreground"
                      title={d.latestMessage}
                    >
                      {d.latestMessage}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="warning" shape="pill" className="gap-1">
                        <PauseCircle className="h-3 w-3" aria-hidden />
                        SLA paused
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary">
                        View
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
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

export default WaitingCustomerPage
