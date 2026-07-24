import { useQuery } from "@tanstack/react-query"
import { listQueryOptions } from "@/lib/listQueryOptions"
import { customerService } from "../services/customerService"

export const useCustomers = (params?: {
  limit?: number;
  offset?: number;
  customer_code?: string;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) => {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customerService.getCustomers(params),
    ...listQueryOptions,
  });
};

export const useCustomerDetail = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customerService.getCustomerDetail(customerId!),
    enabled: !!customerId,
  });
};
