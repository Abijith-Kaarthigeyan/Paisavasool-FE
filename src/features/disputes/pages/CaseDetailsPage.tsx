import React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useCase } from "../hooks/useDisputes"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
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
import {
  Mail,
  User,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react"

export const CaseDetailsPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  const { data: caseData, isLoading, isError, refetch } = useCase(caseId || "")

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (isError || !caseData) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        title="Case not found"
        description="The requested case could not be retrieved."
        action={
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  const disputes = caseData.disputes || []
  const uniqueInvoices = Array.from(new Set(disputes.map((d) => d.invoice_number)))
  const uniqueCategories = Array.from(new Set(disputes.map((d) => d.dispute_category)))

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageBreadcrumb
        items={[
          { label: "Disputes", to: "/disputes" },
          { label: "Cases", to: "/disputes/cases" },
          { label: `Case ${caseData.case_number}` },
        ]}
      />

      <PageHeader
        title={`Case ${caseData.case_number}`}
      />

      <KpiGrid>
        <KpiCard
          label="Generated disputes"
          value={caseData.dispute_count ?? disputes.length}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="Targeted invoices"
          value={uniqueInvoices.length}
          icon={<FileText className="h-4 w-4" />}
        />
        <KpiCard
          label="AI categories identified"
          value={uniqueCategories.length}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" aria-hidden />
                <div>
                  <CardTitle>Original customer email</CardTitle>
                  <CardDescription>
                    Full transcript parsed from the client mail service.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">From</span>
                  <p className="font-medium text-foreground">{caseData.customer_email}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Subject</span>
                  <p className="font-medium text-foreground">
                    {caseData.email_subject || "(No subject)"}
                  </p>
                </div>
                {caseData.original_message_id && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Message-ID</span>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {caseData.original_message_id}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <span className="mb-2 block text-xs font-medium text-muted-foreground">
                  Message body
                </span>
                <div className="min-h-[150px] whitespace-pre-wrap rounded-lg border border-border bg-card p-5 text-sm leading-relaxed text-foreground">
                  {caseData.email_body || "(No message body parsed)"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Generated disputes</CardTitle>
              <CardDescription>
                Dispute records created via triage analysis of this ticket.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {disputes.length === 0 ? (
                <EmptyState
                  title="No disputes"
                  description="No disputes were created from this case."
                  className="py-8"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispute</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((d) => (
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
                          {d.dispute_category}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {d.assigned_user_name || "Unassigned"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            to={`/disputes/${d.id}`}
                            className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open
                            <ArrowRight className="h-3 w-3" aria-hidden />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" aria-hidden />
                <CardTitle className="text-base">Sender profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-mono font-medium">{caseData.customer_email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Disputes raised</span>
                <span className="font-medium tabular-nums">{disputes.length}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {new Date(caseData.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" aria-hidden />
                <CardTitle className="text-base">Involved invoices</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {disputes.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No invoice data mapped.
                </p>
              ) : (
                <div className="divide-y divide-border text-sm">
                  {disputes.map((d) => {
                    const outstanding = d.invoice?.outstanding_amount
                    const total = d.invoice?.total_amount
                    return (
                      <div key={d.id} className="p-3 transition-colors hover:bg-muted/40">
                        <div className="flex items-center justify-between font-medium">
                          <span>{d.invoice_number}</span>
                          <span className="tabular-nums">
                            {outstanding !== undefined
                              ? `₹${outstanding.toLocaleString()}`
                              : "Pending"}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            Total: {total !== undefined ? `₹${total.toLocaleString()}` : "N/A"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CaseDetailsPage
