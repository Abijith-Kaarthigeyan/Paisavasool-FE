import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listQueryOptions } from "@/lib/listQueryOptions"
import { reviewService, type PaymentReviewListParams } from "../services/reviewService"
import { PaymentReviewApproveRequest } from "../types"

export const usePaymentReviews = (params?: PaymentReviewListParams) => {
  return useQuery({
    queryKey: ["paymentReviews", params],
    queryFn: () => reviewService.listPaymentReviews(params),
    ...listQueryOptions,
  })
}

export const usePaymentReviewFilterOptions = () => {
  return useQuery({
    queryKey: ["paymentReviewFilterOptions"],
    queryFn: () => reviewService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  })
}

export const usePaymentDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: ["paymentDetails", id],
    queryFn: () => reviewService.getPaymentDetails(id!),
    enabled: !!id,
  })
}

export const useApproveReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentReviewApproveRequest }) =>
      reviewService.approveReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentReviews"] })
      queryClient.invalidateQueries({ queryKey: ["paymentUploads"] })
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["paymentReviewFilterOptions"] })
    },
  })
}

export const useRejectReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reviewService.rejectReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentReviews"] })
      queryClient.invalidateQueries({ queryKey: ["paymentUploads"] })
      queryClient.invalidateQueries({ queryKey: ["paymentReviewFilterOptions"] })
    },
  })
}
