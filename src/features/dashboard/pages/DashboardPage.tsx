import React from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { AdminDashboard } from "./AdminDashboard"
import { ManagerDashboard } from "./ManagerDashboard"
import { AssociateDashboard } from "./AssociateDashboard"
import { Navigate } from "react-router-dom"
import { EmailPollFab } from "@/features/email-intake/components/EmailPollFab"

const POLL_ALLOWED_ROLES = ["ADMIN", "FINANCE_MANAGER", "FINANCE_ASSOCIATE"]

export const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const canPollEmails = POLL_ALLOWED_ROLES.includes(user.role)

  const dashboard = (() => {
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
  })();

  return (
    <div className="animate-in fade-in duration-150">
      {dashboard}
      {canPollEmails && <EmailPollFab />}
    </div>
  );
};

export default DashboardPage;
