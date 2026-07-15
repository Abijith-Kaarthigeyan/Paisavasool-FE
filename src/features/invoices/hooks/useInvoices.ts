import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { invoiceService } from "../services/invoiceService"

export const useInvoices = (params?: {
  customer_id?: string;
  status?: string;
  search?: string;
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
      if (!state) return 2000;
      const hasPendingReview =
        (state.pending_review_count ?? 0) > 0 ||
        state.files?.some((f) => f.status === "PENDING_REVIEW");
      if (
        (state.status === "COMPLETED" ||
          state.status === "FAILED" ||
          state.status === "PARTIAL_SUCCESS") &&
        !hasPendingReview
      ) {
        return false;
      }
      return 2000;
    },
  });
};

export const useBatchReviewItems = (batchId: string | undefined) => {
  return useQuery({
    queryKey: ["batchReviewItems", batchId],
    queryFn: () => invoiceService.getBatchReviewItems(batchId!),
    enabled: !!batchId,
    refetchInterval: 3000,
  });
};

export const useDuplicateReviewContext = (reviewId: string | undefined) => {
  return useQuery({
    queryKey: ["duplicateReviewContext", reviewId],
    queryFn: () => invoiceService.getDuplicateReviewContext(reviewId!),
    enabled: !!reviewId,
  });
};

export const useDuplicateReviewMutations = (batchId: string | undefined) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["batchStatus", batchId] });
    queryClient.invalidateQueries({ queryKey: ["batchReviewItems", batchId] });
    queryClient.invalidateQueries({ queryKey: ["duplicateReviewContext"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  const approve = useMutation({
    mutationFn: ({ reviewId, notes }: { reviewId: string; notes?: string }) =>
      invoiceService.approveDuplicateReview(reviewId, notes),
    onSuccess: invalidate,
  });

  const editAndApply = useMutation({
    mutationFn: ({
      reviewId,
      amendedInvoiceJson,
      notes,
    }: {
      reviewId: string;
      amendedInvoiceJson: Record<string, unknown>;
      notes?: string;
    }) => invoiceService.editAndApplyDuplicateReview(reviewId, amendedInvoiceJson, notes),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ reviewId, notes }: { reviewId: string; notes?: string }) =>
      invoiceService.rejectDuplicateReview(reviewId, notes),
    onSuccess: invalidate,
  });

  return { approve, editAndApply, reject };
};
