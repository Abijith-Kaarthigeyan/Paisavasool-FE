import { useEffect } from "react"
import { BrowserRouter } from "react-router-dom"
import { Provider, useDispatch, useSelector } from "react-redux"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { store, RootState } from "@/app/store"
import { AppRoutes } from "@/app/routes"
import { authService } from "@/features/auth/services/authService"
import { setCredentials, clearCredentials, setAuthStatus } from "@/features/auth/slices/authSlice"
import { ToastProvider } from "@/components/ui/toast"
import { getCookie } from "@/lib/cookies"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Turn off automatic query retries for cleaner API testing
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const restoreSession = async () => {
      dispatch(setAuthStatus("loading"));
      try {
        // If the user is already on the "session expired" login page,
        // don't keep calling /auth/me (it can trigger refresh + redirect loops).
        const isSessionExpiredPage =
          typeof window !== "undefined" &&
          window.location.pathname === "/login" &&
          new URLSearchParams(window.location.search).get("session_expired") ===
            "true";
        if (isSessionExpiredPage) {
          dispatch(clearCredentials());
          dispatch(setAuthStatus("idle"));
          return;
        }

        const profile = await authService.getMe();
        // Since getMe succeeds, cookies are valid. Retrieve actual JWT exp from cookie
        const expiresAtStr = getCookie("access_token_expires_at");
        const exp = expiresAtStr ? parseInt(expiresAtStr, 10) : Math.floor(Date.now() / 1000) + 2700;
        
        dispatch(
          setCredentials({
            sub: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            role: profile.role.role_name,
            is_active: profile.is_active,
            exp,
          })
        );
      } catch (err) {
        // Safe to ignore on initial load (user is simply not authenticated)
        dispatch(clearCredentials());
      }
    };

    restoreSession();
  }, [dispatch]);

  // Proactive background silent refresh loop
  useEffect(() => {
    if (!isAuthenticated || !user?.exp) return;

    const checkAndRefresh = async () => {
      const remainingTime = user.exp - Math.floor(Date.now() / 1000);
      
      // Proactively refresh when token has <= 60 seconds left
      if (remainingTime <= 60) {
        try {
          // Trigger refresh (updates HTTPOnly and non-HTTPOnly cookies on the client)
          await authService.refresh();
          
          // Retrieve updated user details and exact expiration timestamp
          const profile = await authService.getMe();
          const expiresAtStr = getCookie("access_token_expires_at");
          const exp = expiresAtStr ? parseInt(expiresAtStr, 10) : Math.floor(Date.now() / 1000) + 2700;
          
          dispatch(
            setCredentials({
              sub: profile.id,
              email: profile.email,
              first_name: profile.first_name,
              role: profile.role.role_name,
              is_active: profile.is_active,
              exp,
            })
          );
        } catch (err: any) {
          console.error("Proactive silent refresh failed:", err);
          // Only force logout if it's an explicit 401/403 (invalid refresh token)
          if (err.response?.status === 401 || err.response?.status === 403) {
            dispatch(clearCredentials());
            if (typeof window !== "undefined") {
              window.location.href = "/login?session_expired=true";
            }
          }
        }
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkAndRefresh, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.exp, dispatch]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </QueryClientProvider>
    </Provider>
  );
}
