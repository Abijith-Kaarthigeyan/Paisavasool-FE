import React, { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate, Link } from "react-router-dom"
import { authService } from "@/features/auth/services/authService"
import { clearCredentials } from "@/features/auth/slices/authSlice"
import { UserResponse } from "@/types"

export const AssociatePage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getMe();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching associate profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
    <div className="min-h-screen bg-background p-6 font-sans">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Finance Associate Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Validating Role: FINANCE_ASSOCIATE
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/invoice-upload"
              className="flex items-center justify-center rounded border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Invoice Upload
            </Link>
            <button
              onClick={handleLogout}
              className="rounded bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">User Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-semibold text-foreground">
                    {profile.first_name} {profile.last_name}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-foreground">{profile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`font-semibold ${
                      profile.is_active ? "text-success" : "text-destructive"
                    }`}
                  >
                    {profile.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Role & Permissions Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">RBAC Metadata</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Assigned Role:</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {profile.role.role_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-2">Role Description:</span>
                  <p className="rounded bg-muted p-2 text-xs italic text-muted-foreground">
                    {profile.role.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded bg-destructive/10 p-4 text-center text-destructive">
            Failed to retrieve user profile credentials. Please ensure the backend is running.
          </div>
        )}
      </div>
    </div>
  );
};
