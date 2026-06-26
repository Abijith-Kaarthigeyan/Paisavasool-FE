import React from "react"
import { useOpenCollections } from "../hooks/useCollections"
import { CollectionsCasesTable } from "../components/CollectionsCasesTable"

export const OpenCasesPage: React.FC = () => {
  const { data: cases = [], isLoading, isError, refetch } = useOpenCollections()

  return (
    <CollectionsCasesTable
      cases={cases}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      title="Open collection cases"
      showAssignedColumn
      filterMode="full"
    />
  )
}

export default OpenCasesPage
