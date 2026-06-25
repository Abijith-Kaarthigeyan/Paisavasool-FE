import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useDisputes } from "../hooks/useDisputes"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, FolderOpen, ArrowRight, Home } from "lucide-react"

export const WaitingInternalTeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes();

  // Filter disputes with status WAITING_INTERNAL
  const waitingDisputes = useMemo(() => {
    return disputes.filter((d) => d.status === "WAITING_INTERNAL");
  }, [disputes]);

  const disputesEnriched = useMemo(() => {
    return waitingDisputes.map((d) => {
      // Calculate days waiting
      const updatedDate = new Date(d.updated_at).getTime();
      const now = Date.now();
      const diffTime = Math.abs(now - updatedDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      // Determine internal department and action based on category
      let department = "Finance Audit";
      let action = "Verify ledger entries and credit limits";

      if (d.dispute_category === "PRICING_DISCREPANCY") {
        department = "Sales & Account Management";
        action = "Confirm contractual agreement pricing details";
      } else if (d.dispute_category === "TAX_DISCREPANCY") {
        department = "Tax & Compliance";
        action = "Examine tax-exempt certifications";
      } else if (d.dispute_category === "RETURNS_EXCHANGES") {
        department = "Logistics Operations";
        action = "Audit warehouse goods receipt notes (GRN)";
      }

      return {
        ...d,
        daysWaiting: diffDays,
        department,
        action,
      };
    });
  }, [waitingDisputes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Waiting for Internal Teams
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track disputes currently blocked waiting for confirmation, ledger validations, or authorization reviews from internal departments.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh list
        </button>
      </header>

      {/* Grid Table */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-4">
              <FolderOpen className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Queue</h3>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Retry
              </button>
            </div>
          ) : disputesEnriched.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderOpen className="h-10 w-10 text-slate-350 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No disputes are currently pending internal team responses.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">Dispute Number</th>
                    <th className="py-3 px-4">Invoice Number</th>
                    <th className="py-3 px-4">Department Queue</th>
                    <th className="py-3 px-4">Assigned Associate</th>
                    <th className="py-3 px-4 text-center">Days Waiting</th>
                    <th className="py-3 px-4">Pending Action Needed</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {disputesEnriched.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => navigate(`/disputes/${d.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-primary">
                        {d.dispute_number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {d.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-bold flex items-center gap-1">
                        <Home className="h-3.5 w-3.5 text-slate-400" /> {d.department}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-semibold">
                        {d.assigned_user_name || "Unassigned"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                        {d.daysWaiting} days
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium italic">
                        {d.action}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-xs font-bold text-primary inline-flex items-center gap-0.5 hover:underline">
                          View details <ArrowRight className="h-3.5 w-3.5" />
                        </span>
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
  );
};

export default WaitingInternalTeamPage;
