import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useDisputes } from "../hooks/useDisputes"
import { isWaitingInternalTeamDispute } from "../utils/disputeFormatters"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
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
import { RefreshCw, FolderOpen, ArrowRight, Home } from "lucide-react"

export const WaitingInternalTeamPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes()

  const waitingDisputes = useMemo(() => {
    return disputes.filter(isWaitingInternalTeamDispute)
  }, [disputes])

  const disputesEnriched = useMemo(() => {
    return waitingDisputes.map((d) => {
      const updatedDate = new Date(d.updated_at).getTime()
      const now = Date.now()
      const diffTime = Math.abs(now - updatedDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1

      let department = "Finance audit"
      let action = "Verify ledger entries and credit limits"

      if (d.dispute_category === "PRICING_DISCREPANCY") {
        department = "Sales & account management"
        action = "Confirm contractual agreement pricing details"
      } else if (d.dispute_category === "TAX_DISCREPANCY") {
        department = "Tax & compliance"
        action = "Examine tax-exempt certifications"
      } else if (d.dispute_category === "RETURNS_EXCHANGES") {
        department = "Logistics operations"
        action = "Audit warehouse goods receipt notes (GRN)"
      }

      return { ...d, daysWaiting: diffDays, department, action }
    })
  }, [waitingDisputes])

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageBreadcrumb
        items={[
          { label: "Disputes", to: "/disputes" },
          { label: "Waiting for internal teams" },
        ]}
      />

      <PageHeader
        title="Waiting for internal teams"
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
              title="Failed to load queue"
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : disputesEnriched.length === 0 ? (
            <EmptyState
              title="No pending internal reviews"
              description="No disputes are currently waiting on internal team responses."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Associate</TableHead>
                  <TableHead className="text-center">Days waiting</TableHead>
                  <TableHead>Pending action</TableHead>
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
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <Home className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        {d.department}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.assigned_user_name || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums">
                      {d.daysWaiting} days
                    </TableCell>
                    <TableCell className="max-w-[240px] text-muted-foreground">
                      {d.action}
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

export default WaitingInternalTeamPage
