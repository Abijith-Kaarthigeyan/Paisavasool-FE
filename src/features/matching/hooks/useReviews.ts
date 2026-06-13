import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { reviewService } from "../services/reviewService"
import { PaymentReviewApproveRequest } from "../types"

export const usePaymentReviews = (params?: { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ["paymentReviews", params],
    queryFn: () => reviewService.listPaymentReviews(params),
  });
};

export const usePaymentDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: ["paymentDetails", id],
    queryFn: () => reviewService.getPaymentDetails(id!),
    enabled: !!id,
  });
};

export const useApproveReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentReviewApproveRequest }) =>
      reviewService.approveReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentReviews"] });
      queryClient.invalidateQueries({ queryKey: ["paymentUploads"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

export const useRejectReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewService.rejectReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentReviews"] });
      queryClient.invalidateQueries({ queryKey: ["paymentUploads"] });
    },
  });
};
