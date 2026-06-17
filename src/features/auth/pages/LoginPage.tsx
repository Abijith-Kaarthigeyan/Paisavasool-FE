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
import { CreditCard, Mail, Lock, Eye, EyeOff, Loader2, KeyRound, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react"

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  const isSessionExpired = searchParams.get("session_expired") === "true";

  const {
    register,
    handleSubmit,
    setValue,
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

  const handleFillCredentials = (email: string, pass: string) => {
    setValue("email", email);
    setValue("password", pass);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 shadow-inner mb-4">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Paisa Vasool
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Accounts Receivable Assistant
          </p>
        </div>

        {/* Info Banners */}
        {isSessionExpired && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Your session has expired. Please log in again to continue.</span>
          </div>
        )}

        {apiError && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  disabled={isLoading}
                  {...register("email")}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-primary focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  placeholder="name@paisavasool.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  disabled={isLoading}
                  {...register("password")}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-primary focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center items-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Collapsible Test Credentials Panel */}
        <div className="mt-6 border-t border-slate-800/80 pt-5">
          <button
            type="button"
            onClick={() => setShowTestAccounts(!showTestAccounts)}
            className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all bg-slate-900/30 hover:bg-slate-900/60 rounded-lg border border-slate-800/50 hover:cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              Demo / Test Accounts
            </span>
            {showTestAccounts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showTestAccounts && (
            <div className="mt-3 p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/60 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex flex-col gap-1 text-[11px] text-slate-400">
                <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-800/40">
                  <div>
                    <span className="font-semibold text-slate-200 block">Administrator Account</span>
                    <span className="font-mono text-slate-500">admin@paisavasool.com</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFillCredentials("admin@paisavasool.com", "ChangeMe123!")}
                    className="px-2.5 py-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded hover:bg-primary hover:text-white transition-all duration-150 hover:cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
