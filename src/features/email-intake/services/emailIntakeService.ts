import { arApi } from "@/lib/axios"
import { readTotalCount, toPaginatedList, type PaginatedList } from "@/lib/table"
import type { EmailIntakeItem, EmailManualActionRequest, EmailPollResponse } from "../types"

export interface ListManualReviewParams {
  search?: string
  classification?: string
  created_at_from?: string
  created_at_to?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
  limit?: number
  offset?: number
}

export const emailIntakeService = {
  pollInbox: async (): Promise<EmailPollResponse> => {
    const response = await arApi.post<EmailPollResponse>("/emails/poll")
    return response.data
  },

  listManualReview: async (
    params?: ListManualReviewParams
  ): Promise<PaginatedList<EmailIntakeItem>> => {
    const response = await arApi.get<EmailIntakeItem[]>("/emails/manual-review", {
      params,
    })
    const items = response.data ?? []
    return toPaginatedList(items, readTotalCount(response, { itemsLength: items.length }))
  },

  confirmAction: async (
    intakeId: string,
    body: EmailManualActionRequest
  ): Promise<EmailIntakeItem> => {
    const response = await arApi.post<EmailIntakeItem>(
      `/emails/${intakeId}/confirm`,
      body
    )
    return response.data
  },
}

export default emailIntakeService
