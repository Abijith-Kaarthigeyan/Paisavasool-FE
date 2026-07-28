import { arApi } from "@/lib/axios"
import { readTotalCount, toPaginatedList, type PaginatedList } from "@/lib/table"
import {
  PaymentReviewResponse,
  PaymentDetailsResponse,
  PaymentReviewApproveRequest,
} from "../types"

export type PaymentReviewListParams = {
  limit?: number
  offset?: number
  status?: string
  reason?: string
  search?: string
  confidence?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
}

export const reviewService = {
  listPaymentReviews: async (
    params?: PaymentReviewListParams
  ): Promise<PaginatedList<PaymentReviewResponse>> => {
    const response = await arApi.get<PaymentReviewResponse[]>("/payment-reviews", {
      params,
    })
    const items = response.data ?? []
    return toPaginatedList(items, readTotalCount(response, { itemsLength: items.length }))
  },

  getFilterOptions: async (): Promise<{ reasons: string[] }> => {
    const response = await arApi.get<{ reasons: string[] }>(
      "/payment-reviews/filter-options"
    )
    return response.data
  },

  getPaymentDetails: async (id: string): Promise<PaymentDetailsResponse> => {
    const response = await arApi.get<PaymentDetailsResponse>(`/payments/${id}`)
    return response.data
  },

  approveReview: async (id: string, data: PaymentReviewApproveRequest): Promise<any> => {
    const response = await arApi.post(`/payment-reviews/${id}/approve`, data)
    return response.data
  },

  rejectReview: async (id: string): Promise<any> => {
    const response = await arApi.post(`/payment-reviews/${id}/reject`)
    return response.data
  },
}

export default reviewService
