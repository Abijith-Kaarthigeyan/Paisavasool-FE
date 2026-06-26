import React, { useMemo } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { useDisputes } from "../hooks/useDisputes"
import { DisputesTable } from "../components/DisputesTable"

export const MyAssignedDisputesPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes();

  const assignedDisputes = useMemo(() => {
    if (!user) return [];
    return disputes.filter((d) => d.assigned_to === user.sub);
  }, [disputes, user]);

  return (
    <DisputesTable
      disputes={assignedDisputes}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      title="My Assigned Disputes"
    />
  );
};

export default MyAssignedDisputesPage;
