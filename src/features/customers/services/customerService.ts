import { arApi } from "@/lib/axios"
import { Customer, CustomerDetail } from "../types"

export const customerService = {
  getCustomers: async (params?: {
    limit?: number;
    offset?: number;
    customer_code?: string;
  }): Promise<Customer[]> => {
    const response = await arApi.get("/customers", { params });
    return response.data;
  },

  getCustomerDetail: async (id: string): Promise<CustomerDetail> => {
    const response = await arApi.get(`/customers/${id}`);
    return response.data;
  },
};

export default customerService;
