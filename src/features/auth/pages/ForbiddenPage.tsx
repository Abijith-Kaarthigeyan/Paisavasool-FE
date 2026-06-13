import React from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { clearCredentials } from "@/features/auth/slices/authSlice"
import { authService } from "@/features/auth/services/authService"

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      dispatch(clearCredentials());
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-6xl font-extrabold text-rose-500 m-0">403</h1>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You do not have the required permissions or role privileges to view this page.
        </p>
        <div className="flex flex-col gap-2 pt-4">
          <button
            onClick={handleGoBack}
            className="w-full rounded bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleLogout}
            className="w-full rounded bg-secondary py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/95 transition-colors"
          >
            Logout & Sign In Again
          </button>
        </div>
      </div>
    </div>
  );
};
