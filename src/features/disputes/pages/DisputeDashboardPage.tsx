import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useDisputes, useCases } from "../hooks/useDisputes"
import { KpiCard } from "@/components/ui/kpi-card"
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
} from "recharts"
import {
  isTerminalDisputeStatus,
  isNonClosedDispute,
  needsAssociateInput,
  isWaitingInternalTeamDispute,
  isEscalatedDispute,
} from "../utils/disputeFormatters"
import { CHART_COLORS, SLA_HEALTH_COLORS } from "@/lib/design-tokens"
import { ChartHoverTooltip } from "@/components/ui/chart-tooltip"
import {
  AlertTriangle,
  Clock,
  UserCheck,
  HelpCircle,
  List,
  RefreshCw,
  FolderOpen,
} from "lucide-react"
import { KpiWidgetWithLink } from "@/features/dashboard/components/KpiWidgetWithLink"
import { getDisputeCategoryDrillDownPath } from "@/features/dashboard/utils/chartDrillDown"
import { CLIENT_FETCH_CAP } from "@/lib/table"

export const DisputeDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: disputes = [], isLoading, isSlaLoading, refetch } = useDisputes({
    limit: CLIENT_FETCH_CAP,
  })
  const { data: casesPage, isLoading: isCasesLoading } = useCases({
    limit: CLIENT_FETCH_CAP,
  })
  const disputeCases = casesPage?.items ?? []

  const metrics = useMemo(() => {
    return {
      open: disputes.filter(isNonClosedDispute).length,
      waitingCustomer: disputes.filter((d) => d.status === "WAITING_CUSTOMER").length,
      waitingInternal: disputes.filter(isWaitingInternalTeamDispute).length,
      escalated: disputes.filter(isEscalatedDispute).length,
      slaBreached: disputes.filter((d) => d.sla?.status === "BREACHED" && !isTerminalDisputeStatus(d.status)).length,
      all: disputes.length,
      reviewQueueCount: disputes.filter(needsAssociateInput).length,
    };
  }, [disputes]);

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

  const isPageLoading = isLoading || isCasesLoading;
  const isSlaSectionLoading = isPageLoading || !!isSlaLoading;

  return (
    <div className="-mx-page-side -my-3 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col gap-3 overflow-hidden px-page-side py-3">
      <PageHeader
        className="shrink-0"
        title="Dispute Operations Center"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh Center
          </Button>
        }
      />

      <div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiWidgetWithLink
          label="Open disputes"
          value={metrics.open}
          loading={isPageLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="info"
          to="/disputes/open"
          linkLabel="View open disputes"
        />
        <KpiWidgetWithLink
          label="Review queue"
          value={metrics.reviewQueueCount}
          loading={isPageLoading}
          icon={<HelpCircle className="h-5 w-5" />}
          iconTone="warning"
          to="/disputes/review-queue"
          linkLabel="Go to view review queue"
        />
        <KpiWidgetWithLink
          label="Waiting customer"
          value={metrics.waitingCustomer}
          loading={isPageLoading}
          icon={<UserCheck className="h-5 w-5" />}
          iconTone="warning"
          to="/disputes/waiting-customer"
          linkLabel="View waiting customer"
        />
        <KpiWidgetWithLink
          label="Waiting team"
          value={metrics.waitingInternal}
          loading={isPageLoading}
          icon={<Clock className="h-5 w-5" />}
          iconTone="warning"
          to="/disputes/waiting-internal"
          linkLabel="View waiting team"
        />
        <KpiWidgetWithLink
          label="Escalated"
          value={metrics.escalated}
          loading={isPageLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="destructive"
          to="/disputes/escalated"
          linkLabel="View escalated disputes"
        />
        <KpiCard
          label="SLA breached"
          value={metrics.slaBreached}
          loading={isSlaSectionLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="destructive"
        />
        <KpiWidgetWithLink
          label="All disputes"
          value={metrics.all}
          loading={isPageLoading}
          icon={<List className="h-5 w-5" />}
          iconTone="primary"
          to="/disputes/all"
          linkLabel="View all disputes"
        />
        <KpiWidgetWithLink
          label="Dispute cases"
          value={disputeCases.length}
          loading={isPageLoading}
          icon={<FolderOpen className="h-5 w-5" />}
          iconTone="primary"
          to="/disputes/cases"
          linkLabel="View dispute cases"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard
          title="Disputes by category"
          description="Volume segmented by classification."
          loading={isPageLoading}
          empty={categoryChartData.length === 0}
          height="h-full"
          className="min-h-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis fontSize={9} fontWeight={600} allowDecimals={false} />
              <Tooltip content={<ChartHoverTooltip valueLabel="disputes" />} cursor={{ fill: "hsl(var(--muted) / 0.35)" }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} cursor="pointer">
                {categoryChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    onClick={() => navigate(getDisputeCategoryDrillDownPath(entry.name))}
                  />
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
          height="h-full"
          className="min-h-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius="42%"
                outerRadius="68%"
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {statusChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartHoverTooltip valueLabel="disputes" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="SLA health status"
          description="SLA threshold warnings of active disputes."
          loading={isSlaSectionLoading}
          empty={
            slaChartData.length === 0
              ? { title: "No active SLA records", description: "No active dispute SLA records found." }
              : false
          }
          height="h-full"
          className="min-h-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={slaChartData}
                cx="50%"
                cy="50%"
                innerRadius="42%"
                outerRadius="68%"
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {slaChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartHoverTooltip valueLabel="disputes" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

export default DisputeDashboardPage;
