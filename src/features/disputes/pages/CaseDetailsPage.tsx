import React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useCase } from "../hooks/useDisputes"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Mail,
  User,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react"

export const CaseDetailsPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { data: caseData, isLoading, isError, refetch } = useCase(caseId || "");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-44"><Skeleton className="h-full w-full" /></div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !caseData) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">Case Not Found</h3>
        <p className="text-xs text-muted-foreground">The requested case could not be retrieved.</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  const disputes = caseData.disputes || [];
  const uniqueInvoices = Array.from(new Set(disputes.map((d) => d.invoice_number)));
  const uniqueCategories = Array.from(new Set(disputes.map((d) => d.dispute_category)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div className="space-y-2">
          <button
            onClick={() => navigate("/disputes/cases")}
            className="flex items-center text-xs font-bold text-muted-foreground hover:text-foreground gap-1 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" /> Back to Cases
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Case {caseData.case_number}
            </h1>
            <Badge variant={caseData.status === "OPEN" ? "default" : "outline"}>
              {caseData.status}
            </Badge>
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Ingested on {new Date(caseData.created_at).toLocaleString()}
        </span>
      </header>

      {/* Case Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Generated Disputes</span>
              <p className="text-xl font-bold text-foreground font-mono">{caseData.dispute_count}</p>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Targeted Invoices</span>
              <p className="text-xl font-bold text-foreground font-mono">{uniqueInvoices.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Categories Identified</span>
              <p className="text-xl font-bold text-foreground font-mono">{uniqueCategories.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Original Email (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Original Customer Email Intake</CardTitle>
                  <CardDescription>Full transcript parsed from client mail service.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-border text-xs space-y-2">
                <div>
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px] block">From:</span>
                  <span className="font-semibold text-foreground">{caseData.customer_email}</span>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px] block">Subject:</span>
                  <span className="font-bold text-foreground text-sm">{caseData.email_subject || "(No Subject)"}</span>
                </div>
                {caseData.original_message_id && (
                  <div>
                    <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px] block">Message-ID:</span>
                    <span className="font-mono text-muted-foreground text-[10px] truncate block">{caseData.original_message_id}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] mb-2 block">Email Message Body</span>
                <div className="p-5 border border-border rounded-lg bg-white dark:bg-zinc-950/20 text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground min-h-[150px]">
                  {caseData.email_body || "(No message body parsed)"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Disputes list */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <CardTitle>Generated Disputes</CardTitle>
              <CardDescription>Dispute records generated via triage analysis of this ticket.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {disputes.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-lg m-4">
                  No disputes created from this case record.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold bg-slate-50/50 dark:bg-zinc-900/10">
                        <th className="py-2.5 px-4">Dispute Number</th>
                        <th className="py-2.5 px-4">Invoice Number</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Assignee</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {disputes.map((d) => (
                        <tr
                          key={d.id}
                          onClick={() => navigate(`/disputes/${d.id}`)}
                          className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-primary">
                            {d.dispute_number}
                          </td>
                          <td className="py-3 px-4 text-foreground font-semibold">{d.invoice_number}</td>
                          <td className="py-3 px-4 text-muted-foreground uppercase text-[10px] font-bold">
                            {d.dispute_category}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-medium">
                            {d.assigned_user_name || "Unassigned"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase font-bold">
                              {d.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/disputes/${d.id}`}
                              className="text-xs font-bold text-primary inline-flex items-center gap-0.5 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Workspace <ArrowRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Customer / Invoice Cards (1 Col) */}
        <div className="space-y-6">
          {/* Customer info */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-sm">Sender Customer Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Customer Email</span>
                  <span className="font-semibold text-foreground font-mono">{caseData.customer_email}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Disputes Raised</span>
                  <span className="font-bold text-foreground font-mono">{disputes.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Invoices */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-sm">Involved Invoices</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {disputes.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No invoice data mapped.
                </div>
              ) : (
                <div className="divide-y divide-border text-xs">
                  {disputes.map((d) => {
                    const outstanding = d.invoice?.outstanding_amount;
                    const total = d.invoice?.total_amount;
                    return (
                      <div key={d.id} className="p-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                        <div className="flex justify-between items-center font-semibold text-foreground">
                          <span>{d.invoice_number}</span>
                          <span>
                            {outstanding !== undefined
                              ? `₹${outstanding.toLocaleString()}`
                              : "Invoice details pending"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                          <span>Total Amount: {total !== undefined ? `₹${total.toLocaleString()}` : "N/A"}</span>
                          <span className="uppercase text-[9px] font-bold">
                            Invoice Status: {d.invoice?.status || "UNKNOWN"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsPage;
