import { arApi } from "@/lib/axios"
import type { EmailIntakeItem, EmailManualActionRequest } from "../types"

export interface EmailPollResponse {
  status: string
  message: string
}

export const emailIntakeService = {
  triggerPoll: async (): Promise<EmailPollResponse> => {
    const response = await arApi.post<EmailPollResponse>("/emails/poll")
    return response.data
  },

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
