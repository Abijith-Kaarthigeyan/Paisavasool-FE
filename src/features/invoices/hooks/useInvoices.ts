import { useQuery } from "@tanstack/react-query"
import { invoiceService } from "../services/invoiceService"

export const useInvoices = (params?: {
  customer_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoiceService.getInvoices(params),
  });
};

export const useBatchInvoices = (batchId: string | undefined) => {
  return useQuery({
    queryKey: ["invoices", "batch", batchId],
    queryFn: () => invoiceService.getBatchInvoices(batchId!),
    enabled: !!batchId,
  });
};

export const useInvoiceDetails = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoiceService.getInvoiceDetails(invoiceId!),
    enabled: !!invoiceId,
  });
};

export const useInvoiceItems = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ["invoice", invoiceId, "items"],
    queryFn: () => invoiceService.getInvoiceItems(invoiceId!),
    enabled: !!invoiceId,
  });
};

export const useInvoiceVersions = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ["invoice", invoiceId, "versions"],
    queryFn: () => invoiceService.getInvoiceVersions(invoiceId!),
    enabled: !!invoiceId,
  });
};

export const useInvoiceVersion = (
  invoiceId: string | undefined,
  version: number | null
) => {
  return useQuery({
    queryKey: ["invoice", invoiceId, "version", version],
    queryFn: () => invoiceService.getInvoiceVersion(invoiceId!, version!),
    enabled: !!invoiceId && version != null && version > 0,
  });
};

export const useBatchStatus = (batchId: string | undefined) => {
  return useQuery({
    queryKey: ["batchStatus", batchId],
    queryFn: () => invoiceService.getBatchStatus(batchId!),
    enabled: !!batchId,
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state && (state.status === "COMPLETED" || state.status === "FAILED" || state.status === "PARTIAL_SUCCESS")) {
        return false;
      }
      return 2000; // Poll status every 2 seconds if still UPLOADED/PROCESSING
    },
  });
};
