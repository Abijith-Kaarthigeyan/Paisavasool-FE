import React from "react"
import { useCollectionAnalytics, useAgingAnalytics } from "../hooks/useCollections"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
  AlertCircle,
  RefreshCw,
} from "lucide-react"

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"];

export const CollectionsDashboardPage: React.FC = () => {
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
    refetch: refetchMetrics,
  } = useCollectionAnalytics();

  const {
    data: aging,
    isLoading: isAgingLoading,
    isError: isAgingError,
    refetch: refetchAging,
  } = useAgingAnalytics();

  const handleRetry = () => {
    refetchMetrics();
    refetchAging();
  };

  const isLoading = isMetricsLoading || isAgingLoading;
  const isError = isMetricsError || isAgingError;

  // Prepare chart data for Stacked Bar Chart
  const barChartData = aging
    ? [
        {
          name: "Current",
          "Outstanding Amount": aging.CURRENT,
        },
        {
          name: "0-30 Days",
          "Outstanding Amount": aging["0-30"],
        },
        {
          name: "31-60 Days",
          "Outstanding Amount": aging["31-60"],
        },
        {
          name: "61-90 Days",
          "Outstanding Amount": aging["61-90"],
        },
        {
          name: "90+ Days",
          "Outstanding Amount": aging["90_PLUS"] || 0,
        },
      ]
    : [];

  // Prepare chart data for Pie Chart
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Collections Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time aging analytics, collection efficiency rates, and case queues monitoring.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Analytics
        </button>
      </header>

      {isError ? (
        <Card className="border-destructive/20 bg-destructive/5 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground mb-2">
            Failed to Load Collections Analytics
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            An error occurred while fetching the analytics records. Ensure the backend collections service is active.
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
          >
            Retry Fetch
          </button>
        </Card>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Open Cases
                  </span>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? <Skeleton className="h-7 w-10" /> : metrics?.open_cases ?? 0}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <FolderOpen className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Escalated
                  </span>
                  <p className="text-2xl font-bold text-rose-500">
                    {isLoading ? <Skeleton className="h-7 w-10" /> : metrics?.escalated_cases ?? 0}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Broken Promises
                  </span>
                  <p className="text-2xl font-bold text-amber-500">
                    {isLoading ? <Skeleton className="h-7 w-10" /> : metrics?.broken_promises ?? 0}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <HeartOff className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Effectiveness
                  </span>
                  <p className="text-2xl font-bold text-emerald-500">
                    {isLoading ? (
                      <Skeleton className="h-7 w-14" />
                    ) : (
                      `${((metrics?.collection_effectiveness ?? 0) * 100).toFixed(1)}%`
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Percent className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Collected
                  </span>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? (
                      <Skeleton className="h-7 w-20" />
                    ) : (
                      `₹${(metrics?.collected_amount ?? 0).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Outstanding
                  </span>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? (
                      <Skeleton className="h-7 w-20" />
                    ) : (
                      `₹${totalOutstanding.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-500/10 text-slate-500">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Aging Bucket Distribution Chart */}
            <Card className="lg:col-span-2 shadow-xs border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle>Aging Bucket Distribution</CardTitle>
                <CardDescription>
                  Outstanding amount distribution grouped by invoice age days.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : totalOutstanding === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground font-semibold">
                    No active outstanding balances found.
                  </div>
                ) : (
                  <div className="h-[300px] w-full">
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
                          tickFormatter={(value) => `₹${value.toLocaleString(undefined, { notation: "compact" })}`}
                        />
                        <Tooltip
                          formatter={(value: any) => [`₹${value.toLocaleString()}`, "Outstanding Amount"]}
                          labelStyle={{ fontWeight: "bold" }}
                        />
                        <Legend />
                        <Bar
                          dataKey="Outstanding Amount"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aging Percentage Breakdown Chart */}
            <Card className="shadow-xs border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle>Bucket Percentage Breakdown</CardTitle>
                <CardDescription>
                  Proportion of outstanding total per aging category.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col items-center justify-center">
                {isLoading ? (
                  <Skeleton className="h-[220px] w-[220px] rounded-full" />
                ) : totalOutstanding === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground font-semibold">
                    No active balances.
                  </div>
                ) : (
                  <>
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
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [
                              `₹${value.toLocaleString()} (${((value / totalOutstanding) * 100).toFixed(1)}%)`,
                              "Amount",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 w-full text-xs font-semibold text-muted-foreground">
                      {pieChartData.map((d, index) => (
                        <div key={d.name} className="flex items-center space-x-2">
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="truncate">
                            {d.name}: {((d.value / totalOutstanding) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Aging Buckets Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "CURRENT", amount: aging?.CURRENT ?? 0, color: "bg-emerald-500" },
              { label: "0-30 DAYS", amount: aging?.["0-30"] ?? 0, color: "bg-blue-500" },
              { label: "31-60 DAYS", amount: aging?.["31-60"] ?? 0, color: "bg-amber-500" },
              { label: "61-90 DAYS", amount: aging?.["61-90"] ?? 0, color: "bg-orange-500" },
              { label: "90+ DAYS", amount: aging?.["90_PLUS"] || 0, color: "bg-rose-500" },
            ].map((bucket) => (
              <Card key={bucket.label}>
                <CardHeader className="py-3.5 border-b border-border mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${bucket.color}`} />
                    <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground m-0">
                      {bucket.label}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-lg font-bold text-foreground font-mono">
                    ₹{bucket.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {totalOutstanding > 0
                      ? `${((bucket.amount / totalOutstanding) * 100).toFixed(1)}% of total balance`
                      : "0% of total balance"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CollectionsDashboardPage;
