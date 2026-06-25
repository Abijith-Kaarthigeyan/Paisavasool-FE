import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import { useDisputes, useReviewQueue } from "../hooks/useDisputes"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { ChartCard } from "@/components/ui/chart-card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
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
import { isTerminalDisputeStatus } from "../utils/disputeFormatters"
import { CHART_COLORS, SLA_HEALTH_COLORS } from "@/lib/design-tokens"
import {
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react"

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
      escalated: disputes.filter((d) => d.sla?.status === "BREACHED" && !isTerminalDisputeStatus(d.status)).length,
      slaBreached: disputes.filter((d) => d.sla?.status === "BREACHED" && !isTerminalDisputeStatus(d.status)).length,
      resolvedToday: disputes.filter((d) => d.status === "RESOLVED" && d.resolved_at?.startsWith(today)).length,
      reviewQueueCount: reviewQueue.filter((r) => r.status === "PENDING").length,
    };
  }, [disputes, reviewQueue]);

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    disputes.forEach((d) => {
      const cat = d.dispute_category || "Unclassified";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [disputes]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    disputes.forEach((d) => {
      const stat = d.status || "Unknown";
      counts[stat] = (counts[stat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [disputes]);

  const slaChartData = useMemo(() => {
    let healthy = 0;
    let atRisk = 0;
    let breached = 0;

    disputes.forEach((d) => {
      if (isTerminalDisputeStatus(d.status)) return;
      const status = d.sla?.status;
      if (!status) return;
      if (status === "ON_TRACK") healthy++;
      else if (status === "AT_RISK") atRisk++;
      else if (status === "BREACHED") breached++;
    });

    return [
      { name: "Healthy (0-79%)", value: healthy, color: SLA_HEALTH_COLORS.healthy },
      { name: "At Risk (80-99%)", value: atRisk, color: SLA_HEALTH_COLORS.atRisk },
      { name: "Breached (100%+)", value: breached, color: SLA_HEALTH_COLORS.breached },
    ].filter((d) => d.value > 0);
  }, [disputes]);

  const isPageLoading = isLoading || isReviewQueueLoading;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dispute Operations Center"
        description="Monitor incoming invoice disputes, SLA tracking, AI triage classification confidence, and associate queue workloads."
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh Center
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Open disputes"
          value={metrics.open}
          loading={isPageLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="info"
        />
        <KpiCard
          label="In review"
          value={metrics.inReview}
          loading={isPageLoading}
          icon={<Clock className="h-5 w-5" />}
          iconTone="primary"
        />
        <KpiCard
          label="Waiting customer"
          value={metrics.waitingCustomer}
          loading={isPageLoading}
          icon={<UserCheck className="h-5 w-5" />}
          iconTone="warning"
        />
        <KpiCard
          label="Waiting team"
          value={metrics.waitingInternal}
          loading={isPageLoading}
          icon={<Clock className="h-5 w-5" />}
          iconTone="warning"
        />
      </KpiGrid>

      <KpiGrid>
        <KpiCard
          label="Escalated"
          value={metrics.escalated}
          loading={isPageLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="destructive"
        />
        <KpiCard
          label="SLA breached"
          value={metrics.slaBreached}
          loading={isPageLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="destructive"
        />
        <KpiCard
          label="Resolved today"
          value={metrics.resolvedToday}
          loading={isPageLoading}
          icon={<CheckCircle className="h-5 w-5" />}
          iconTone="success"
        />
        <KpiCard
          label="Review queue"
          value={metrics.reviewQueueCount}
          loading={isPageLoading}
          icon={<HelpCircle className="h-5 w-5" />}
          iconTone="warning"
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard
          title="Disputes by category"
          description="Volume segmented by classification."
          loading={isPageLoading}
          empty={categoryChartData.length === 0}
          height="h-56"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={9} fontWeight={600} />
              <YAxis fontSize={9} fontWeight={600} />
              <Tooltip formatter={(v: number | string) => [v, "Disputes"]} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {categoryChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Disputes by status"
          description="Current workflow status allocation."
          loading={isPageLoading}
          empty={statusChartData.length === 0}
          height="h-56"
        >
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
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number | string) => [v, "Disputes"]} />
              <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="SLA health status"
          description="SLA threshold warnings of active disputes."
          loading={isPageLoading}
          empty={
            slaChartData.length === 0
              ? { title: "No active SLA records", description: "No active dispute SLA records found." }
              : false
          }
          height="h-56"
        >
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
              <Tooltip formatter={(v: number | string) => [v, "Disputes"]} />
              <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader className="mb-4 flex flex-row items-center justify-between border-b border-border pb-3">
          <div>
            <CardTitle>Recent Unresolved Disputes</CardTitle>
            <CardDescription>List of active issues requiring immediate review.</CardDescription>
          </div>
          <Link to="/disputes/open" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
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
            <div className="py-8 text-center text-xs text-muted-foreground">
              No disputes found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="px-2 pb-3">Dispute Number</th>
                    <th scope="col" className="px-2 pb-3">Invoice</th>
                    <th scope="col" className="px-2 pb-3">Category</th>
                    <th scope="col" className="px-2 pb-3">SLA Status</th>
                    <th scope="col" className="px-2 pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {disputes
                    .filter((d) => !isTerminalDisputeStatus(d.status))
                    .slice(0, 5)
                    .map((d) => (
                      <tr
                        key={d.id}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                      >
                        <td className="px-2 py-2.5 font-semibold text-foreground">
                          <Link to={`/disputes/${d.id}`} className="text-primary hover:underline">
                            {d.dispute_number}
                          </Link>
                        </td>
                        <td className="px-2 py-2.5 font-medium text-muted-foreground">{d.invoice_number}</td>
                        <td className="px-2 py-2.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          {d.dispute_category}
                        </td>
                        <td className="px-2 py-2.5">
                          <Badge
                            variant={
                              d.sla?.status === "BREACHED"
                                ? "destructive"
                                : d.sla?.status === "AT_RISK"
                                ? "warning"
                                : "success"
                            }
                            className="px-1.5 py-0 text-[9px] font-bold uppercase"
                          >
                            {d.sla?.status
                              ? d.sla.status === "CLOSED" || isTerminalDisputeStatus(d.status)
                                ? "Closed"
                                : d.sla.status.replace(/_/g, " ")
                              : "No SLA"}
                          </Badge>
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-bold uppercase">
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
