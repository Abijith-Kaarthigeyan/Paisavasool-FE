import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { RoleName } from "@/types"

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, status } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();

  // If the initial check is still running, show a simple loading indicator
  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Verifying authentication session...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to 403 Forbidden if user does not possess required role
  if (allowedRoles && !allowedRoles.includes(user.role as RoleName)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
