import { useQuery } from "@tanstack/react-query"
import { invoiceUploadService } from "../services/invoiceUploadService"

export const useInvoices = (params?: {
  customer_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoiceUploadService.getInvoices(params),
  });
};

export const useBatchInvoices = (batchId: string | undefined) => {
  return useQuery({
    queryKey: ["invoices", "batch", batchId],
    queryFn: () => invoiceUploadService.getBatchInvoices(batchId!),
    enabled: !!batchId,
  });
};

export const useInvoiceDetails = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoiceUploadService.getInvoiceDetails(invoiceId!),
    enabled: !!invoiceId,
  });
};

export const useInvoiceItems = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ["invoice", invoiceId, "items"],
    queryFn: () => invoiceUploadService.getInvoiceItems(invoiceId!),
    enabled: !!invoiceId,
  });
};
