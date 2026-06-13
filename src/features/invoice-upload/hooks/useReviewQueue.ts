import { useQuery } from "@tanstack/react-query"
import { invoiceUploadService } from "../services/invoiceUploadService"

export const useReviewQueue = () => {
  return useQuery({
    queryKey: ["review-queue"],
    queryFn: () => invoiceUploadService.getReviewQueue(),
  });
};
