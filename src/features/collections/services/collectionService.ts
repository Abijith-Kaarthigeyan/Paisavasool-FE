import { arApi } from "@/lib/axios"
import {
  CollectionCase,
  CollectionActivity,
  PaymentPromise,
  ReminderHistory,
  CollectionStatus,
} from "../types"

export const collectionService = {
  getCollections: async (): Promise<CollectionCase[]> => {
    const response = await arApi.get<CollectionCase[]>("/collections");
    return response.data;
  },

  getOpenCollections: async (): Promise<CollectionCase[]> => {
    const response = await arApi.get<CollectionCase[]>("/collections/open");
    return response.data;
  },

  getEscalatedCollections: async (): Promise<CollectionCase[]> => {
    const response = await arApi.get<CollectionCase[]>("/collections/escalated");
    return response.data;
  },

  getMyCollections: async (): Promise<CollectionCase[]> => {
    const response = await arApi.get<CollectionCase[]>("/collections/assigned/me");
    return response.data;
  },

  getBrokenPromises: async (): Promise<CollectionCase[]> => {
    const response = await arApi.get<CollectionCase[]>("/collections/broken-promises");
    return response.data;
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
