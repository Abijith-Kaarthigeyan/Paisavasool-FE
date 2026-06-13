import React from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { AdminDashboard } from "./AdminDashboard"
import { ManagerDashboard } from "./ManagerDashboard"
import { AssociateDashboard } from "./AssociateDashboard"
import { Navigate } from "react-router-dom"

export const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "ADMIN":
      return <AdminDashboard />;
    case "FINANCE_MANAGER":
      return <ManagerDashboard />;
    case "FINANCE_ASSOCIATE":
      return <AssociateDashboard />;
    default:
      return <Navigate to="/403" replace />;
  }
};

export default DashboardPage;
