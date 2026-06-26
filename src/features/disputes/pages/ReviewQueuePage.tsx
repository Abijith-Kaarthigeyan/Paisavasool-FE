import React, { useMemo } from "react"
import { useDisputes } from "../hooks/useDisputes"
import { DisputesTable } from "../components/DisputesTable"
import { needsAssociateInput } from "../utils/disputeFormatters"

export const ReviewQueuePage: React.FC = () => {
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes()

  const reviewQueueDisputes = useMemo(
    () => disputes.filter(needsAssociateInput),
    [disputes]
  )

  return (
    <DisputesTable
      disputes={reviewQueueDisputes}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      title="Dispute review queue"
    />
  )
}

export default ReviewQueuePage
