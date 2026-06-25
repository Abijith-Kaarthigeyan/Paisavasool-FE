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
      description="Browse and manage collection cases assigned to your profile."
      showAssignedColumn={false}
      filterMode="basic"
    />
  )
}

export default AssignedCasesPage
