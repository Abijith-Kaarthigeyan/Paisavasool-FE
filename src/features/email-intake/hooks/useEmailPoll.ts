import { useMutation, useQueryClient } from "@tanstack/react-query"
import { emailIntakeService } from "../services/emailIntakeService"

export const useEmailPoll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => emailIntakeService.triggerPoll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentUploads"] })
      queryClient.invalidateQueries({ queryKey: ["disputes"] })
      queryClient.invalidateQueries({ queryKey: ["disputeReviewQueue"] })
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
    },
  })
}
