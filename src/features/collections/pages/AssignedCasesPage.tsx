import React, { useState } from "react"
import { CLIENT_FETCH_CAP, TABLE_PAGE_SIZE } from "@/lib/table"
import { useAssignedCases } from "../hooks/useCollections"
import { CollectionsCasesTable } from "../components/CollectionsCasesTable"

export const AssignedCasesPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [clientOnlyPaging, setClientOnlyPaging] = useState(false)

  const {
    data: cases = [],
    total = 0,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = useAssignedCases({
    limit: clientOnlyPaging ? CLIENT_FETCH_CAP : TABLE_PAGE_SIZE,
    offset: clientOnlyPaging ? 0 : (page - 1) * TABLE_PAGE_SIZE,
  })

  return (
    <CollectionsCasesTable
      cases={cases}
      isLoading={isLoading}
      isFetching={isFetching}
      isPlaceholderData={isPlaceholderData}
      isError={isError}
      refetch={refetch}
      title="My assigned cases"
      showAssignedColumn={false}
      filterMode="basic"
      serverTotal={clientOnlyPaging ? undefined : total}
      page={clientOnlyPaging ? undefined : page}
      onPageChange={clientOnlyPaging ? undefined : setPage}
      onNeedsClientPagingChange={setClientOnlyPaging}
    />
  )
}

export default AssignedCasesPage
