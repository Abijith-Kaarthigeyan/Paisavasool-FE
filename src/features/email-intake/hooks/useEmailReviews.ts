import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { emailIntakeService } from "../services/emailIntakeService"
import type { EmailManualActionRequest } from "../types"

export const EMAIL_MANUAL_REVIEW_QUERY_KEY = ["emailManualReview"] as const

export const useEmailManualReview = (params?: { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: [...EMAIL_MANUAL_REVIEW_QUERY_KEY, params],
    queryFn: () => emailIntakeService.listManualReview(params),
  })
}

export const useConfirmEmailAction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EmailManualActionRequest }) =>
      emailIntakeService.confirmAction(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAIL_MANUAL_REVIEW_QUERY_KEY })
    },
  })
}
