import { arApi } from "@/lib/axios"
import { readTotalCount, toPaginatedList, type PaginatedList } from "@/lib/table"
import {
  CollectionCase,
  CollectionActivity,
  PaymentPromise,
  ReminderHistory,
  CollectionStatus,
} from "../types"

export interface CollectionCaseListParams {
  status?: string;
  priority?: string;
  aging_bucket?: string;
  customer_id?: string;
  assigned_to?: string;
  search?: string;
  outstanding_amount_min?: number;
  outstanding_amount_max?: number;
  opened_at_from?: string;
  opened_at_to?: string;
  created_at_from?: string;
  created_at_to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export const collectionService = {
  getCollections: async (
    params?: CollectionCaseListParams
  ): Promise<PaginatedList<CollectionCase>> => {
    const response = await arApi.get<CollectionCase[]>("/collections", { params });
    const items = response.data ?? [];
    return toPaginatedList(items, readTotalCount(response, { itemsLength: items.length }));
  },

  getOpenCollections: async (
    params?: CollectionCaseListParams
  ): Promise<PaginatedList<CollectionCase>> => {
    const response = await arApi.get<CollectionCase[]>("/collections/open", { params });
    const items = response.data ?? [];
    return toPaginatedList(items, readTotalCount(response, { itemsLength: items.length }));
  },

  getEscalatedCollections: async (
    params?: CollectionCaseListParams
  ): Promise<PaginatedList<CollectionCase>> => {
    const response = await arApi.get<CollectionCase[]>("/collections/escalated", {
      params,
    });
    const items = response.data ?? [];
    return toPaginatedList(items, readTotalCount(response, { itemsLength: items.length }));
  },

  getMyCollections: async (
    params?: CollectionCaseListParams
  ): Promise<PaginatedList<CollectionCase>> => {
    const response = await arApi.get<CollectionCase[]>("/collections/assigned/me", {
      params,
    });
    const items = response.data ?? [];
    return toPaginatedList(items, readTotalCount(response, { itemsLength: items.length }));
  },

  getBrokenPromises: async (
    params?: CollectionCaseListParams
  ): Promise<PaginatedList<CollectionCase>> => {
    const response = await arApi.get<CollectionCase[]>("/collections/broken-promises", {
      params,
    });
    const items = response.data ?? [];
    return toPaginatedList(items, readTotalCount(response, { itemsLength: items.length }));
  },

  getCollectionById: async (id: string): Promise<CollectionCase> => {
    const response = await arApi.get<CollectionCase>(`/collections/${id}`);
    return response.data;
  },

  reassignCase: async (id: string, associateId: string): Promise<CollectionCase> => {
    const response = await arApi.post<CollectionCase>(`/collections/${id}/reassign`, {
      new_associate_id: associateId,
    });
    return response.data;
  },

  createActivity: async (
    id: string,
    activityType: string,
    notes?: string
  ): Promise<CollectionActivity> => {
    const response = await arApi.post<CollectionActivity>(`/collections/${id}/activity`, {
      activity_type: activityType,
      notes: notes || null,
    });
    return response.data;
  },

  createPromise: async (
    id: string,
    promisedDate: string
  ): Promise<PaymentPromise> => {
    const response = await arApi.post<PaymentPromise>(`/collections/${id}/promise`, {
      promised_date: promisedDate,
    });
    return response.data;
  },

  escalateCase: async (id: string): Promise<CollectionCase> => {
    const response = await arApi.post<CollectionCase>(`/collections/${id}/escalate`);
    return response.data;
  },

  closeCase: async (id: string): Promise<CollectionCase> => {
    const response = await arApi.post<CollectionCase>(`/collections/${id}/close`);
    return response.data;
  },

  overrideStatus: async (
    id: string,
    newStatus: CollectionStatus | string
  ): Promise<CollectionCase> => {
    const response = await arApi.post<CollectionCase>(`/collections/${id}/override-status`, {
      new_status: newStatus,
    });
    return response.data;
  },

  getPromises: async (): Promise<PaymentPromise[]> => {
    const response = await arApi.get<PaymentPromise[]>("/promises");
    return response.data;
  },

  getReminderHistory: async (): Promise<ReminderHistory[]> => {
    const response = await arApi.get<ReminderHistory[]>("/reminders/history");
    return response.data;
  },
};

export default collectionService;
