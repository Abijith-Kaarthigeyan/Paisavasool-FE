import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { purchaseOrderService } from "../services/purchaseOrderService"

export const usePurchaseOrders = (params?: {
  customer_id?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}) => {
  return useQuery({
    queryKey: ["purchase-orders", params],
    queryFn: () => purchaseOrderService.listPurchaseOrders(params),
  })
}

export const usePurchaseOrderDetails = (poId: string | undefined) => {
  return useQuery({
    queryKey: ["purchase-order", poId],
    queryFn: () => purchaseOrderService.getPurchaseOrder(poId!),
    enabled: !!poId,
  })
}

export const usePurchaseOrderItems = (poId: string | undefined) => {
  return useQuery({
    queryKey: ["purchase-order", poId, "items"],
    queryFn: () => purchaseOrderService.getPurchaseOrderItems(poId!),
    enabled: !!poId,
  })
}

export const usePurchaseOrderInvoices = (poId: string | undefined) => {
  return useQuery({
    queryKey: ["purchase-order", poId, "invoices"],
    queryFn: () => purchaseOrderService.getLinkedInvoices(poId!),
    enabled: !!poId,
  })
}

export const usePurchaseOrderGrns = (poId: string | undefined) => {
  return useQuery({
    queryKey: ["purchase-order", poId, "grns"],
    queryFn: () => purchaseOrderService.getLinkedGrns(poId!),
    enabled: !!poId,
  })
}

export const usePoBatchStatus = (batchId: string | undefined) => {
  return useQuery({
    queryKey: ["poBatchStatus", batchId],
    queryFn: () => purchaseOrderService.getBatchStatus(batchId!),
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

export const useBatchPurchaseOrders = (batchId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ["poBatchPurchaseOrders", batchId],
    queryFn: () => purchaseOrderService.getBatchPurchaseOrders(batchId!),
    enabled: !!batchId && enabled,
  })
}

export const useLinkInvoiceToPurchaseOrder = (poId: string | undefined) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId: string) =>
      purchaseOrderService.linkInvoice(poId!, invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", poId] })
      queryClient.invalidateQueries({ queryKey: ["purchase-order", poId, "invoices"] })
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["invoice"] })
    },
  })
}
