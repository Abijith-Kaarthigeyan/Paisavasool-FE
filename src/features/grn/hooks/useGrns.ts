import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listQueryOptions } from "@/lib/listQueryOptions"
import { grnService, type ListGrnsParams } from "../services/grnService"

export const useGrns = (params?: ListGrnsParams) => {
  return useQuery({
    queryKey: ["grns", params],
    queryFn: () => grnService.listGrns(params),
    ...listQueryOptions,
  })
}

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

export const useLinkGrnToPurchaseOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ grnId, poId }: { grnId: string; poId: string }) =>
      grnService.linkPo(grnId, poId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grn", variables.grnId] })
      queryClient.invalidateQueries({ queryKey: ["grns"] })
      queryClient.invalidateQueries({ queryKey: ["grnBatchGrns"] })
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
      queryClient.invalidateQueries({
        queryKey: ["purchase-order", variables.poId, "grns"],
      })
      queryClient.invalidateQueries({ queryKey: ["purchase-order", variables.poId] })
    },
  })
}
