import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import { useDisputes, useReviewQueue } from "../hooks/useDisputes"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const DisputeDashboardPage: React.FC = () => {
  const { data: disputes = [], isLoading, refetch } = useDisputes();
  const { data: reviewQueue = [], isLoading: isReviewQueueLoading } = useReviewQueue();

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      open: disputes.filter((d) => d.status === "OPEN").length,
      inReview: disputes.filter((d) => d.status === "IN_REVIEW").length,
      waitingCustomer: disputes.filter((d) => d.status === "WAITING_CUSTOMER").length,
      waitingInternal: disputes.filter((d) => d.status === "WAITING_INTERNAL").length,
      escalated: disputes.filter((d) => d.sla?.status === "BREACHED" && d.status !== "RESOLVED" && d.status !== "CLOSED").length, // or has escalations
      slaBreached: disputes.filter((d) => d.sla?.status === "BREACHED" && d.status !== "RESOLVED" && d.status !== "CLOSED").length,
      resolvedToday: disputes.filter((d) => d.status === "RESOLVED" && d.resolved_at?.startsWith(today)).length,
      reviewQueueCount: reviewQueue.filter((r) => r.status === "PENDING").length,
    };
  }, [disputes, reviewQueue]);

  // Chart Data: Category
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    disputes.forEach((d) => {
      const cat = d.dispute_category || "Unclassified";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [disputes]);

  // Chart Data: Status
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    disputes.forEach((d) => {
      const stat = d.status || "Unknown";
      counts[stat] = (counts[stat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [disputes]);

  // Chart Data: SLA Health
  const slaChartData = useMemo(() => {
    let healthy = 0;
    let atRisk = 0;
    let breached = 0;

    disputes.forEach((d) => {
      if (d.status === "RESOLVED" || d.status === "CLOSED") return;
      const status = d.sla?.status || "ON_TRACK";
      if (status === "ON_TRACK") healthy++;
      else if (status === "AT_RISK") atRisk++;
      else if (status === "BREACHED") breached++;
    });

    return [
      { name: "Healthy (0-79%)", value: healthy, color: "#10b981" },
      { name: "At Risk (80-99%)", value: atRisk, color: "#f59e0b" },
      { name: "Breached (100%+)", value: breached, color: "#ef4444" },
    ].filter(d => d.value > 0);
  }, [disputes]);

  const isPageLoading = isLoading || isReviewQueueLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Dispute Operations Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor incoming invoice disputes, SLA tracking, AI triage classification confidence, and associate queue workloads.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Center
        </button>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Open Disputes</span>
              <p className="text-2xl font-bold text-foreground">
                {isPageLoading ? <Skeleton className="h-7 w-12" /> : metrics.open}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">In Review</span>
              <p className="text-2xl font-bold text-foreground">
                {isPageLoading ? <Skeleton className="h-7 w-12" /> : metrics.inReview}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Waiting Customer</span>
              <p className="text-2xl font-bold text-foreground">
                {isPageLoading ? <Skeleton className="h-7 w-12" /> : metrics.waitingCustomer}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-500">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Waiting Team</span>
              <p className="text-2xl font-bold text-foreground">
                {isPageLoading ? <Skeleton className="h-7 w-12" /> : metrics.waitingInternal}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Escalated</span>
              <p className="text-2xl font-bold text-red-500 font-mono">
                {isPageLoading ? <Skeleton className="h-7 w-12" /> : metrics.escalated}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SLA Breached</span>
              <p className="text-2xl font-bold text-rose-500 font-mono">
                {isPageLoading ? <Skeleton className="h-7 w-12" /> : metrics.slaBreached}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resolved Today</span>
              <p className="text-2xl font-bold text-emerald-500">
                {isPageLoading ? <Skeleton className="h-7 w-12" /> : metrics.resolvedToday}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Review Queue</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {isPageLoading ? <Skeleton className="h-7 w-12" /> : metrics.reviewQueueCount}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <HelpCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-xs border-border">
          <CardHeader className="pb-3 border-b border-border mb-3">
            <CardTitle className="text-sm">Disputes by Category</CardTitle>
            <CardDescription>Volume segmented by classification.</CardDescription>
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : categoryChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
                No data available.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={9} fontWeight={600} />
                    <YAxis fontSize={9} fontWeight={600} />
                    <Tooltip formatter={(v: any) => [v, "Disputes"]} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                      {categoryChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border">
          <CardHeader className="pb-3 border-b border-border mb-3">
            <CardTitle className="text-sm">Disputes by Status</CardTitle>
            <CardDescription>Current workflow status allocation.</CardDescription>
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : statusChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
                No data available.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [v, "Disputes"]} />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border">
          <CardHeader className="pb-3 border-b border-border mb-3">
            <CardTitle className="text-sm">SLA Health Status</CardTitle>
            <CardDescription>SLA threshold warnings of active disputes.</CardDescription>
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : slaChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
                No active dispute SLA records found.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slaChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {slaChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [v, "Disputes"]} />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access List */}
      <Card className="shadow-xs border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border mb-4">
          <div>
            <CardTitle>Recent Unresolved Disputes</CardTitle>
            <CardDescription>List of active issues requiring immediate review.</CardDescription>
          </div>
          <Link to="/disputes/open" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
            View Open Disputes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {isPageLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No disputes found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <th className="pb-3 px-2">Dispute Number</th>
                    <th className="pb-3 px-2">Invoice</th>
                    <th className="pb-3 px-2">Category</th>
                    <th className="pb-3 px-2">SLA Status</th>
                    <th className="pb-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {disputes
                    .filter((d) => d.status !== "RESOLVED" && d.status !== "CLOSED")
                    .slice(0, 5)
                    .map((d) => (
                      <tr
                        key={d.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-2 font-semibold text-foreground">
                          <Link to={`/disputes/${d.id}`} className="hover:underline text-primary">
                            {d.dispute_number}
                          </Link>
                        </td>
                        <td className="py-2.5 px-2 text-muted-foreground font-medium">{d.invoice_number}</td>
                        <td className="py-2.5 px-2 text-muted-foreground font-semibold text-[10px] uppercase">
                          {d.dispute_category}
                        </td>
                        <td className="py-2.5 px-2">
                          <Badge
                            variant={
                              d.sla?.status === "BREACHED"
                                ? "destructive"
                                : d.sla?.status === "AT_RISK"
                                ? "warning"
                                : "success"
                            }
                            className="text-[9px] py-0 px-1.5 uppercase font-bold"
                          >
                            {d.sla?.status || "ON_TRACK"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase font-bold">
                            {d.status}
                          </Badge>
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
  )
}

export default DisputeDashboardPage;
