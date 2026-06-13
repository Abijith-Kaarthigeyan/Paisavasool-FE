import { arApi } from "@/lib/axios"
import { 
  PaymentReviewResponse, 
  PaymentDetailsResponse, 
  PaymentReviewApproveRequest 
} from "../types"

export const reviewService = {
  listPaymentReviews: async (params?: { limit?: number; offset?: number }): Promise<PaymentReviewResponse[]> => {
    const response = await arApi.get<PaymentReviewResponse[]>("/payment-reviews", { params });
    return response.data;
  },

  getPaymentDetails: async (id: string): Promise<PaymentDetailsResponse> => {
    const response = await arApi.get<PaymentDetailsResponse>(`/payments/${id}`);
    return response.data;
  },

  approveReview: async (id: string, data: PaymentReviewApproveRequest): Promise<any> => {
    const response = await arApi.post(`/payment-reviews/${id}/approve`, data);
    return response.data;
  },

  rejectReview: async (id: string): Promise<any> => {
    const response = await arApi.post(`/payment-reviews/${id}/reject`);
    return response.data;
  },
};

export default reviewService;
