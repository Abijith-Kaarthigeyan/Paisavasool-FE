import { arApi } from "@/lib/axios"

export interface EmailPollResponse {
  status: string
  message: string
}

export const emailIntakeService = {
  triggerPoll: async (): Promise<EmailPollResponse> => {
    const response = await arApi.post<EmailPollResponse>("/emails/poll")
    return response.data
  },
}

export default emailIntakeService
