import { useEffect } from "react"
import { BrowserRouter } from "react-router-dom"
import { Provider, useDispatch } from "react-redux"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { store } from "@/app/store"
import { AppRoutes } from "@/app/routes"
import { AuthDebugPanel } from "@/components/AuthDebugPanel"
import { authService } from "@/features/auth/services/authService"
import { setCredentials, clearCredentials, setAuthStatus } from "@/features/auth/slices/authSlice"
import { ToastProvider } from "@/components/ui/toast"

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

  useEffect(() => {
    const restoreSession = async () => {
      dispatch(setAuthStatus("loading"));
      try {
        const profile = await authService.getMe();
        // Since getMe succeeds, cookies are valid. Estimate remaining JWT exp (e.g. 15 mins)
        dispatch(
          setCredentials({
            sub: profile.id,
            email: profile.email,
            role: profile.role.role_name,
            is_active: profile.is_active,
            exp: Math.floor(Date.now() / 1000) + 900,
          })
        );
      } catch (err) {
        // Safe to ignore on initial load (user is simply not authenticated)
        dispatch(clearCredentials());
      }
    };

    restoreSession();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AppRoutes />
        <AuthDebugPanel />
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
