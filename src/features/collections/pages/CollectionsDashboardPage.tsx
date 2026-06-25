import React from "react"
import { useCollectionAnalytics, useAgingAnalytics } from "../hooks/useCollections"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { ChartCard } from "@/components/ui/chart-card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  FolderOpen,
  AlertTriangle,
  HeartOff,
  Percent,
  TrendingUp,
  DollarSign,
  RefreshCw,
} from "lucide-react"
import { CHART_COLORS } from "@/lib/design-tokens"

export const CollectionsDashboardPage: React.FC = () => {
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
    refetch: refetchMetrics,
    dataUpdatedAt: metricsUpdatedAt,
  } = useCollectionAnalytics();

  const {
    data: aging,
    isLoading: isAgingLoading,
    isError: isAgingError,
    refetch: refetchAging,
    dataUpdatedAt: agingUpdatedAt,
  } = useAgingAnalytics();

  const handleRetry = () => {
    refetchMetrics();
    refetchAging();
  };

  const isLoading = isMetricsLoading || isAgingLoading;
  const isError = isMetricsError || isAgingError;

  const barChartData = aging
    ? [
        { name: "Current", "Outstanding Amount": aging.CURRENT },
        { name: "0-30 Days", "Outstanding Amount": aging["0-30"] },
        { name: "31-60 Days", "Outstanding Amount": aging["31-60"] },
        { name: "61-90 Days", "Outstanding Amount": aging["61-90"] },
        { name: "90+ Days", "Outstanding Amount": aging["90_PLUS"] || 0 },
      ]
    : [];

  const pieChartData = aging
    ? [
        { name: "Current", value: aging.CURRENT },
        { name: "0-30 Days", value: aging["0-30"] },
        { name: "31-60 Days", value: aging["31-60"] },
        { name: "61-90 Days", value: aging["61-90"] },
        { name: "90+ Days", value: aging["90_PLUS"] || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const totalOutstanding = aging?.outstanding_amount || 0;

  const latestUpdate = Math.max(metricsUpdatedAt ?? 0, agingUpdatedAt ?? 0);
  const lastUpdated =
    latestUpdate > 0
      ? `Last updated ${new Date(latestUpdate).toLocaleTimeString()}`
      : undefined;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Collections Analytics Dashboard"
        description="Real-time aging analytics, collection efficiency rates, and case queues monitoring."
        meta={lastUpdated}
        actions={
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh Analytics
          </Button>
        }
      />

      {isError ? (
        <ChartCard
          title="Collections analytics"
          error={{
            title: "Failed to load collections analytics",
            message:
              "An error occurred while fetching the analytics records. Ensure the backend collections service is active.",
            onRetry: handleRetry,
          }}
          height="h-48"
        />
      ) : (
        <>
          <KpiGrid columns={6}>
            <KpiCard
              label="Open cases"
              value={metrics?.open_cases ?? 0}
              loading={isLoading}
              icon={<FolderOpen className="h-5 w-5" />}
              iconTone="info"
            />
            <KpiCard
              label="Escalated"
              value={metrics?.escalated_cases ?? 0}
              loading={isLoading}
              icon={<AlertTriangle className="h-5 w-5" />}
              iconTone="destructive"
            />
            <KpiCard
              label="Broken promises"
              value={metrics?.broken_promises ?? 0}
              loading={isLoading}
              icon={<HeartOff className="h-5 w-5" />}
              iconTone="warning"
            />
            <KpiCard
              label="Effectiveness"
              value={`${((metrics?.collection_effectiveness ?? 0) * 100).toFixed(1)}%`}
              loading={isLoading}
              icon={<Percent className="h-5 w-5" />}
              iconTone="success"
            />
            <KpiCard
              label="Collected"
              value={`₹${(metrics?.collected_amount ?? 0).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`}
              loading={isLoading}
              icon={<TrendingUp className="h-5 w-5" />}
              iconTone="primary"
            />
            <KpiCard
              label="Outstanding"
              value={`₹${totalOutstanding.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`}
              loading={isLoading}
              icon={<DollarSign className="h-5 w-5" />}
              iconTone="default"
            />
          </KpiGrid>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartCard
              title="Aging bucket distribution"
              description="Outstanding amount distribution grouped by invoice age days."
              loading={isLoading}
              empty={
                totalOutstanding === 0
                  ? {
                      title: "No outstanding balances",
                      description: "No active outstanding balances found.",
                    }
                  : false
              }
              height="h-[300px]"
              className="lg:col-span-2"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} fontWeight={600} />
                  <YAxis
                    fontSize={11}
                    fontWeight={600}
                    tickFormatter={(value) =>
                      `₹${value.toLocaleString(undefined, { notation: "compact" })}`
                    }
                  />
                  <Tooltip
                    formatter={(value: number | string) => [
                      `₹${Number(value).toLocaleString()}`,
                      "Outstanding Amount",
                    ]}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="Outstanding Amount"
                    fill={CHART_COLORS[2]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Bucket percentage breakdown"
              description="Proportion of outstanding total per aging category."
              loading={isLoading}
              empty={
                totalOutstanding === 0
                  ? { title: "No active balances", description: "No outstanding balances to display." }
                  : false
              }
              height="h-[300px]"
            >
              <div className="flex h-full flex-col items-center justify-center">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | string) => [
                          `₹${Number(value).toLocaleString()} (${((Number(value) / totalOutstanding) * 100).toFixed(1)}%)`,
                          "Amount",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid w-full grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground">
                  {pieChartData.map((d, index) => (
                    <div key={d.name} className="flex items-center space-x-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="truncate">
                        {d.name}: {((d.value / totalOutstanding) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          <KpiGrid columns={5}>
            {[
              { label: "Current", amount: aging?.CURRENT ?? 0, iconTone: "success" as const },
              { label: "0-30 days", amount: aging?.["0-30"] ?? 0, iconTone: "info" as const },
              { label: "31-60 days", amount: aging?.["31-60"] ?? 0, iconTone: "warning" as const },
              { label: "61-90 days", amount: aging?.["61-90"] ?? 0, iconTone: "warning" as const },
              { label: "90+ days", amount: aging?.["90_PLUS"] || 0, iconTone: "destructive" as const },
            ].map((bucket) => (
              <KpiCard
                key={bucket.label}
                label={bucket.label}
                value={`₹${bucket.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                loading={isLoading}
                icon={<DollarSign className="h-5 w-5" />}
                iconTone={bucket.iconTone}
                trend={{
                  value:
                    totalOutstanding > 0
                      ? `${((bucket.amount / totalOutstanding) * 100).toFixed(1)}% of total balance`
                      : "0% of total balance",
                  direction: "neutral",
                }}
              />
            ))}
          </KpiGrid>
        </>
      )}
    </div>
  );
};

export default CollectionsDashboardPage;
