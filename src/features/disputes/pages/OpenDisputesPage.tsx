import React from "react"
import { DisputesTable } from "../components/DisputesTable"

export const OpenDisputesPage: React.FC = () => {
  return (
    <DisputesTable
      title="Open Disputes"
      baseParams={{ exclude_statuses: "RESOLVED,CLOSED,FAILED" }}
    />
  )
}

export default OpenDisputesPage
