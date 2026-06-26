import React from "react"
import { useCollectionAnalytics, useAgingAnalytics } from "../hooks/useCollections"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { ChartCard } from "@/components/ui/chart-card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import {
  FolderOpen,
  AlertTriangle,
  HeartOff,
  Percent,
  TrendingUp,
  DollarSign,
  RefreshCw,
} from "lucide-react"
import { KpiWidgetWithLink } from "@/features/dashboard/components/KpiWidgetWithLink"
import { CommunicationsFeed } from "@/features/dashboard/components/CommunicationsFeed"
import { AgingBucketChart } from "@/features/dashboard/components/AgingBucketChart"

const CHART_HEIGHT = "h-[300px]"

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

  const totalOutstanding = aging?.outstanding_amount || 0;

  const latestUpdate = Math.max(metricsUpdatedAt ?? 0, agingUpdatedAt ?? 0);
  const lastUpdated =
    latestUpdate > 0
      ? `Last updated ${new Date(latestUpdate).toLocaleTimeString()}`
      : undefined;

  return (
    <div className="-mx-page-side -my-3 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col gap-3 overflow-hidden px-page-side py-3">
      <PageHeader
        className="shrink-0"
        title="Collections Analytics Dashboard"
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
          className="min-h-0 flex-1"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <KpiGrid columns={6} className="shrink-0">
            <KpiWidgetWithLink
              label="Open cases"
              value={metrics?.open_cases ?? 0}
              loading={isLoading}
              icon={<FolderOpen className="h-5 w-5" />}
              iconTone="info"
              to="/collections/open"
              linkLabel="View open cases"
            />
            <KpiCard
              label="Escalated"
              value={metrics?.escalated_cases ?? 0}
              loading={isLoading}
              icon={<AlertTriangle className="h-5 w-5" />}
              iconTone="destructive"
            />
            <KpiWidgetWithLink
              label="Broken promises"
              value={metrics?.broken_promises ?? 0}
              loading={isLoading}
              icon={<HeartOff className="h-5 w-5" />}
              iconTone="warning"
              to="/collections/broken-promises"
              linkLabel="View broken promises"
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

          <div className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="min-h-0 lg:col-span-2">
              <AgingBucketChart
                aging={aging}
                loading={isLoading}
                className="h-full shadow-card"
                height={CHART_HEIGHT}
                title="Aging bucket distribution"
              description="Outstanding balance grouped by aging bucket across open collection cases."
              />
            </div>

            <CommunicationsFeed height={CHART_HEIGHT} maxItems={50} className="min-h-0" />
          </div>

          <KpiGrid columns={5} className="mt-auto shrink-0">
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
        </div>
      )}
    </div>
  );
};

export default CollectionsDashboardPage;
