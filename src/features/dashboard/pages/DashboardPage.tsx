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

  const dashboard = (() => {
    switch (user.role) {
      case "ADMIN":
        return <AdminDashboard />;
      case "FINANCE_MANAGER":
        return (
          <div className="-mx-page-side -my-3 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden px-page-side py-3">
            <ManagerDashboard />
          </div>
        );
      case "FINANCE_ASSOCIATE":
        return (
          <div className="-mx-page-side -my-3 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden px-page-side py-3">
            <AssociateDashboard />
          </div>
        );
      default:
        return <Navigate to="/403" replace />;
    }
  })();

  return dashboard;
};

export default DashboardPage;
