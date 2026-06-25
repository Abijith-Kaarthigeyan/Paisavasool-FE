import React from "react"
import { useDisputes } from "../hooks/useDisputes"
import { DisputesTable } from "../components/DisputesTable"

export const OpenDisputesPage: React.FC = () => {
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes();

  return (
    <DisputesTable
      disputes={disputes}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      title="Open Disputes"
      description="Browse and inspect all active invoice disputes raised by customers."
    />
  );
};

export default OpenDisputesPage;
