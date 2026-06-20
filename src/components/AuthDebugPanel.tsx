import React, { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useLocation } from "react-router-dom"
import { RootState } from "@/app/store"
import { api } from "@/lib/axios"
import { setCredentials, clearCredentials } from "@/features/auth/slices/authSlice"
import { getCookie } from "@/lib/cookies"
import { authService } from "@/features/auth/services/authService"

export const AuthDebugPanel: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Live countdown timer for access token expiry
  useEffect(() => {
    if (!isAuthenticated || !user?.exp) {
      setSecondsLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const diff = Math.floor(user.exp - Date.now() / 1000);
      setSecondsLeft(diff > 0 ? diff : 0);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.post("/auth/refresh");
      // Re-fetch current user profile to update Redux store with new expiration timestamp
      const freshUser = await authService.getMe();
      
      if (user) {
        const expiresAtStr = getCookie("access_token_expires_at");
        const exp = expiresAtStr ? parseInt(expiresAtStr, 10) : Math.floor(Date.now() / 1000) + 2700;

        dispatch(
          setCredentials({
            sub: freshUser.id,
            email: freshUser.email,
            role: freshUser.role.role_name,
            is_active: freshUser.is_active,
            exp,
          })
        );
      }
    } catch (err) {
      console.error("Manual refresh failed", err);
      dispatch(clearCredentials());
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-primary p-3 text-white shadow-lg transition-transform hover:scale-105"
        title="Open Auth Debug Panel"
      >
        <span className="text-xs font-bold font-mono">DEBUG</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-border bg-card p-4 shadow-xl dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
          Auth Service Debug Panel
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground text-xs font-bold font-mono"
        >
          [Minimize]
        </button>
      </div>

      <div className="space-y-2 text-[11px] font-mono">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Auth State:</span>
          <span
            className={`font-bold ${
              isAuthenticated ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {isAuthenticated ? "Authenticated" : "Unauthenticated"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Current Route:</span>
          <span className="font-semibold text-sky-400">{location.pathname}</span>
        </div>

        {isAuthenticated && user ? (
          <>
            <div className="flex justify-between border-t border-dashed border-border pt-1">
              <span className="text-muted-foreground">User ID:</span>
              <span className="truncate max-w-[160px] text-zinc-300" title={user.sub}>
                {user.sub}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="truncate max-w-[160px] text-zinc-300" title={user.email}>
                {user.email}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="rounded bg-primary/20 px-1 py-[2px] font-bold text-primary">
                {user.role}
              </span>
            </div>

            <div className="flex justify-between border-t border-dashed border-border pt-1">
              <span className="text-muted-foreground">Token TTL:</span>
              <span
                className={`font-bold ${
                  secondsLeft !== null && secondsLeft < 60
                    ? "text-rose-500 animate-pulse"
                    : "text-emerald-500"
                }`}
              >
                {secondsLeft !== null
                  ? secondsLeft > 0
                    ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
                    : "Expired"
                  : "N/A"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Cookie Status:</span>
              <span className="text-emerald-500">HTTPOnly Secure</span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex-1 rounded bg-secondary py-[6px] text-center font-bold text-secondary-foreground hover:bg-zinc-700 disabled:opacity-50"
              >
                {isRefreshing ? "Refreshing..." : "Trigger Silent Refresh"}
              </button>
            </div>
          </>
        ) : (
          <div className="rounded bg-rose-950/20 p-2 text-center text-rose-400">
            No active session detected. Please log in to inspect JWT variables.
          </div>
        )}
      </div>
    </div>
  );
};
