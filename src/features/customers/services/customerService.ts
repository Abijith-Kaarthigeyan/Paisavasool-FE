import { arApi } from "@/lib/axios"
import { readTotalCount, toPaginatedList, type PaginatedList } from "@/lib/table"
import { Customer, CustomerDetail } from "../types"

export const customerService = {
  getCustomers: async (params?: {
    limit?: number;
    offset?: number;
    customer_code?: string;
    search?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }): Promise<PaginatedList<Customer>> => {
    const response = await arApi.get("/customers", { params });
    const items: Customer[] = Array.isArray(response.data) ? response.data : [];
    const total = readTotalCount(response, { itemsLength: items.length });
    return toPaginatedList(items, total);
  },

  getCustomerDetail: async (id: string): Promise<CustomerDetail> => {
    const response = await arApi.get(`/customers/${id}`);
    return response.data;
  },
};

export default customerService;
