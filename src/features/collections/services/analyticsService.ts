import { arApi } from "@/lib/axios"
import { AgingAnalytics, CollectionAnalytics } from "../types"

type AgingAnalyticsApiResponse = AgingAnalytics & {
  current_amount?: number
  overdue_0_30?: number
  overdue_31_60?: number
  overdue_61_90?: number
  overdue_90_plus?: number
}

function normalizeAgingAnalytics(data: AgingAnalyticsApiResponse): AgingAnalytics {
  const buckets = {
    CURRENT: data.CURRENT ?? data.current_amount ?? 0,
    "0-30": data["0-30"] ?? data.overdue_0_30 ?? 0,
    "31-60": data["31-60"] ?? data.overdue_31_60 ?? 0,
    "61-90": data["61-90"] ?? data.overdue_61_90 ?? 0,
    "90_PLUS": data["90_PLUS"] ?? data.overdue_90_plus ?? 0,
  }
  const bucketTotal = Object.values(buckets).reduce((sum, amount) => sum + amount, 0)

  return {
    outstanding_amount: data.outstanding_amount > 0 ? data.outstanding_amount : bucketTotal,
    ...buckets,
  }
}

export const analyticsService = {
  getAgingAnalytics: async (): Promise<AgingAnalytics> => {
    const response = await arApi.get<AgingAnalyticsApiResponse>("/analytics/aging");
    return normalizeAgingAnalytics(response.data);
  },

  getCollectionAnalytics: async (): Promise<CollectionAnalytics> => {
    const response = await arApi.get<CollectionAnalytics>("/analytics/collections");
    return response.data;
  },
};

export default analyticsService;
