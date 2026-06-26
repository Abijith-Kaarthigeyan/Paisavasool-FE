import React from "react"
import { useDisputes } from "../hooks/useDisputes"
import { DisputesTable } from "../components/DisputesTable"

export const AllDisputesPage: React.FC = () => {
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes()

  return (
    <DisputesTable
      disputes={disputes}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      title="All disputes"
    />
  )
}

export default AllDisputesPage
