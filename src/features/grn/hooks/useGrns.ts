import { useQuery } from "@tanstack/react-query"
import { grnService } from "../services/grnService"

export const useGrnBatchStatus = (batchId: string | undefined) => {
  return useQuery({
    queryKey: ["grnBatchStatus", batchId],
    queryFn: () => grnService.getBatchStatus(batchId!),
    enabled: !!batchId,
    refetchInterval: (query) => {
      const state = query.state.data
      if (!state) return 3000
      if (
        state.status === "COMPLETED" ||
        state.status === "FAILED" ||
        state.status === "PARTIAL_SUCCESS"
      ) {
        return false
      }
      return 3000
    },
  })
}

export const useBatchGrns = (batchId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ["grnBatchGrns", batchId],
    queryFn: () => grnService.getBatchGrns(batchId!),
    enabled: !!batchId && enabled,
  })
}

export const useGrnDetails = (grnId: string | undefined) => {
  return useQuery({
    queryKey: ["grn", grnId],
    queryFn: () => grnService.getGrn(grnId!),
    enabled: !!grnId,
  })
}
