import { useQuery } from "@tanstack/react-query"
import { disputeService } from "../services/disputeService"

export function useCaseAttachments(caseId: string) {
  return useQuery({
    queryKey: ["caseAttachments", caseId],
    queryFn: () => disputeService.getCaseAttachments(caseId),
    enabled: !!caseId,
  })
}
