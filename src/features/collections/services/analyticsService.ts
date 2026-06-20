import { arApi } from "@/lib/axios"
import { AgingAnalytics, CollectionAnalytics } from "../types"

export const analyticsService = {
  getAgingAnalytics: async (): Promise<AgingAnalytics> => {
    const response = await arApi.get<AgingAnalytics>("/analytics/aging");
    return response.data;
  },

  getCollectionAnalytics: async (): Promise<CollectionAnalytics> => {
    const response = await arApi.get<CollectionAnalytics>("/analytics/collections");
    return response.data;
  },
};

export default analyticsService;
