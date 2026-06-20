import { useQuery } from "@tanstack/react-query"
import { customerService } from "../services/customerService"

export const useCustomers = (params?: {
  limit?: number;
  offset?: number;
  customer_code?: string;
}) => {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customerService.getCustomers(params),
  });
};

export const useCustomerDetail = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customerService.getCustomerDetail(customerId!),
    enabled: !!customerId,
  });
};
