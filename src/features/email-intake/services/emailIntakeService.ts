import { arApi } from "@/lib/axios"
import type { EmailIntakeItem, EmailManualActionRequest } from "../types"

export const emailIntakeService = {
  listManualReview: async (params?: {
    limit?: number
    offset?: number
  }): Promise<EmailIntakeItem[]> => {
    const response = await arApi.get<EmailIntakeItem[]>("/emails/manual-review", {
      params,
    })
    return response.data
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
