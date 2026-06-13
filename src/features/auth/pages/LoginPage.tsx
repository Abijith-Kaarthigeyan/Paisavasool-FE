import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDispatch, useSelector } from "react-redux"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { loginSchema, LoginRequest } from "@/features/auth/types"
import { authService } from "@/features/auth/services/authService"
import { setCredentials, clearCredentials } from "@/features/auth/slices/authSlice"
import { RootState } from "@/app/store"
import { ROLES, RoleType } from "@/config/constants"

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSessionExpired = searchParams.get("session_expired") === "true";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect to correct dashboard if already logged in
  if (isAuthenticated && user) {
    const role = user.role as RoleType;
    if (role === ROLES.ADMIN) return <Navigate to="/admin" replace />;
    if (role === ROLES.FINANCE_MANAGER) return <Navigate to="/manager" replace />;
    if (role === ROLES.FINANCE_ASSOCIATE) return <Navigate to="/associate" replace />;
  }

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Step 1: Perform login API request (sets cookies)
      const loginResponse = await authService.login(data);
      
      // Step 2: Fetch current user profile to verify JWT and get user metadata
      const profile = await authService.getMe();
      
      // Step 3: Extract expiration from TokenResponse details or profile, 
      // let's estimate JWT exp claim based on backend config (e.g. 15 mins = 900 seconds)
      const tokenPayload = {
        sub: profile.id,
        email: profile.email,
        role: profile.role.role_name,
        is_active: profile.is_active,
        exp: Math.floor(Date.now() / 1000) + (loginResponse.expires_in || 900),
      };

      dispatch(setCredentials(tokenPayload));
      
      // Step 4: Redirection based on user role
      const targetRole = profile.role.role_name as RoleType;
      if (targetRole === ROLES.ADMIN) {
        navigate("/admin");
      } else if (targetRole === ROLES.FINANCE_MANAGER) {
        navigate("/manager");
      } else if (targetRole === ROLES.FINANCE_ASSOCIATE) {
        navigate("/associate");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      console.error(err);
      dispatch(clearCredentials());
      if (err.response?.data?.error?.message) {
        setApiError(err.response.data.error.message);
      } else if (err.response?.data?.detail) {
        // Fallback for FastAPI default HTTPExceptions
        setApiError(err.response.data.detail);
      } else {
        setApiError("Login failed. Check your credentials or network status.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground">
            Paisa Vasool Auth
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Microservice Auth Test Client
          </p>
        </div>

        {isSessionExpired && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
            Your session has expired. Please log in again.
          </div>
        )}

        {apiError && (
          <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
            {apiError}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                disabled={isLoading}
                {...register("register" in errors ? "email" : "email")}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="admin@paisavasool.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                disabled={isLoading}
                {...register("password")}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </button>
          </div>
        </form>

        <div className="mt-4 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Test Accounts:</p>
          <div className="grid grid-cols-1 gap-1 text-[10px] font-mono text-muted-foreground">
            <div>Admin: admin@paisavasool.com / ChangeMe123!</div>
          </div>
        </div>
      </div>
    </div>
  );
};
