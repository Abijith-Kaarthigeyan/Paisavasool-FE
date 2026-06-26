import { useMemo } from "react"
import {
  useDispute,
  useCase,
  useActivities,
  useComments,
  useRecommendations,
  useCommunications,
  useEvidence,
  useWorkflowContext,
} from "./useDisputes"
import { useInvoiceItems } from "@/features/invoices/hooks/useInvoices"
import { useCustomerDetail } from "@/features/customers/hooks/useCustomers"
import type { DisputeCommunication } from "../types"

export function useDisputeWorkspace(disputeId: string) {
  const disputeQuery = useDispute(disputeId)
  const dispute = disputeQuery.data

  const caseQuery = useCase(dispute?.case_id || "")
  const activitiesQuery = useActivities(disputeId)
  const commentsQuery = useComments(disputeId)
  const recommendationsQuery = useRecommendations(disputeId)
  const communicationsQuery = useCommunications(disputeId)
  const evidenceQuery = useEvidence(disputeId)
  const wfContextQuery = useWorkflowContext(disputeId)
  const invoiceItemsQuery = useInvoiceItems(dispute?.invoice_id)
  const customerDetailQuery = useCustomerDetail(dispute?.customer_id)

  const customerEmail =
    caseQuery.data?.customer_email || dispute?.customer?.email || null

  const allCommunications = useMemo(() => {
    const communications = communicationsQuery.data ?? []
    const disputeCase = caseQuery.data
    const items: DisputeCommunication[] = [...communications]
    const caseBody = (disputeCase?.raw_content || disputeCase?.email_body || "").trim()

    if (caseBody) {
      const alreadyIncluded = communications.some((comm) => {
        const body = comm.message_body || ""
        return body.includes(caseBody.slice(0, Math.min(caseBody.length, 80)))
      })

      if (!alreadyIncluded) {
        items.unshift({
          id: `case-${disputeCase?.id || "origin"}`,
          dispute_id: disputeId,
          recipient: customerEmail || "customer",
          subject: disputeCase?.email_subject || "Original customer email",
          message_body: caseBody,
          communication_type: "CUSTOMER",
          sent_time: disputeCase?.created_at || dispute?.created_at || "",
          created_at: disputeCase?.created_at || dispute?.created_at || "",
        })
      }
    }

    return items.sort((a, b) => {
      const aTime = new Date(a.sent_time || a.created_at).getTime()
      const bTime = new Date(b.sent_time || b.created_at).getTime()
      return aTime - bTime
    })
  }, [communicationsQuery.data, caseQuery.data, dispute, disputeId, customerEmail])

  const sortedRecommendations = useMemo(() => {
    return [...(recommendationsQuery.data ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [recommendationsQuery.data])

  const latestRecommendation = sortedRecommendations[0] ?? null

  const latestAmendmentRecommendation = useMemo(() => {
    return sortedRecommendations.find((rec) => rec.recommended_invoice_json) || null
  }, [sortedRecommendations])

  return {
    dispute,
    disputeCase: caseQuery.data,
    activities: activitiesQuery.data ?? [],
    comments: commentsQuery.data ?? [],
    recommendations: sortedRecommendations,
    latestRecommendation,
    communications: communicationsQuery.data ?? [],
    allCommunications,
    evidence: evidenceQuery.data ?? [],
    wfContext: wfContextQuery.data,
    invoiceItems: invoiceItemsQuery.data ?? [],
    customerDetail: customerDetailQuery.data,
    customerEmail,
    latestAmendmentRecommendation,
    isLoading: disputeQuery.isLoading,
    isError: disputeQuery.isError,
    refetchDispute: disputeQuery.refetch,
    loading: {
      activities: activitiesQuery.isLoading,
      comments: commentsQuery.isLoading,
      recommendations: recommendationsQuery.isLoading,
      communications: communicationsQuery.isLoading,
      invoiceItems: invoiceItemsQuery.isLoading,
      customerDetail: customerDetailQuery.isLoading,
      wfContext: wfContextQuery.isLoading,
    },
  }
}
