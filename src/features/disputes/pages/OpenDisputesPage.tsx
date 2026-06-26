import React, { useMemo } from "react"
import { useDisputes } from "../hooks/useDisputes"
import { DisputesTable } from "../components/DisputesTable"
import { isNonClosedDispute } from "../utils/disputeFormatters"

export const OpenDisputesPage: React.FC = () => {
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes()

  const openDisputes = useMemo(
    () => disputes.filter(isNonClosedDispute),
    [disputes]
  )

  return (
    <DisputesTable
      disputes={openDisputes}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      title="Open Disputes"
    />
  )
}

export default OpenDisputesPage
