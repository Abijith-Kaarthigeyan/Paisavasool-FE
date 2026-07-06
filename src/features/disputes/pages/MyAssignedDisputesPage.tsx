import React from "react"
import { useMyAssignedDisputes } from "../hooks/useDisputes"
import { DisputesTable } from "../components/DisputesTable"

export const MyAssignedDisputesPage: React.FC = () => {
  const { data: disputes = [], isLoading, isError, refetch } = useMyAssignedDisputes()

  return (
    <DisputesTable
      disputes={disputes}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      title="My Assigned Disputes"
    />
  )
}

export default MyAssignedDisputesPage
