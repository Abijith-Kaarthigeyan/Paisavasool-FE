import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listQueryOptions } from "@/lib/listQueryOptions"
import { emailIntakeService, ListManualReviewParams } from "../services/emailIntakeService"
import type { EmailManualActionRequest } from "../types"

export const EMAIL_MANUAL_REVIEW_QUERY_KEY = ["emailManualReview"] as const

export const useEmailManualReview = (params?: ListManualReviewParams) => {
  return useQuery({
    queryKey: [...EMAIL_MANUAL_REVIEW_QUERY_KEY, params],
    queryFn: () => emailIntakeService.listManualReview(params),
    refetchInterval: 30_000,
    ...listQueryOptions,
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

export const usePollInbox = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => emailIntakeService.pollInbox(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAIL_MANUAL_REVIEW_QUERY_KEY })
    },
  })
}
