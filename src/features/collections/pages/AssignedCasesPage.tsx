import React from "react"
import { useAssignedCases } from "../hooks/useCollections"
import { CollectionsCasesTable } from "../components/CollectionsCasesTable"

export const AssignedCasesPage: React.FC = () => {
  const { data: cases = [], isLoading, isError, refetch } = useAssignedCases()

  return (
    <CollectionsCasesTable
      cases={cases}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      title="My assigned cases"
      showAssignedColumn={false}
      filterMode="basic"
    />
  )
}

export default AssignedCasesPage
