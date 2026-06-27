import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDispatch, useSelector } from "react-redux"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { loginSchema, LoginRequest } from "@/features/auth/types"
import { authService } from "@/features/auth/services/authService"
import { setCredentials, clearCredentials } from "@/features/auth/slices/authSlice"
import { getCookie } from "@/lib/cookies"
import { RootState } from "@/app/store"
import { ROLES, RoleType } from "@/config/constants"
import { LoginDebitCard } from "@/features/auth/components/LoginDebitCard"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTestAccounts, setShowTestAccounts] = useState(false)

  const isSessionExpired = searchParams.get("session_expired") === "true"

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
  })

  if (isAuthenticated && user) {
    const role = user.role as RoleType
    if (role === ROLES.ADMIN) return <Navigate to="/admin" replace />
    if (role === ROLES.FINANCE_MANAGER) return <Navigate to="/manager" replace />
    if (role === ROLES.FINANCE_ASSOCIATE) return <Navigate to="/associate" replace />
  }

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true)
    setApiError(null)
    try {
      const loginResponse = await authService.login(data)
      const profile = await authService.getMe()

      const expiresAtStr = getCookie("access_token_expires_at")
      const exp = expiresAtStr
        ? parseInt(expiresAtStr, 10)
        : Math.floor(Date.now() / 1000) + (loginResponse.expires_in || 2700)

      const tokenPayload = {
        sub: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        role: profile.role.role_name,
        is_active: profile.is_active,
        exp,
      }

      dispatch(setCredentials(tokenPayload))

      const targetRole = profile.role.role_name as RoleType
      if (targetRole === ROLES.ADMIN) {
        navigate("/admin")
      } else if (targetRole === ROLES.FINANCE_MANAGER) {
        navigate("/manager")
      } else if (targetRole === ROLES.FINANCE_ASSOCIATE) {
        navigate("/associate")
      } else {
        navigate("/login")
      }
    } catch (err: unknown) {
      console.error(err)
      dispatch(clearCredentials())
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; detail?: string } } }
      if (axiosErr.response?.data?.error?.message) {
        setApiError(axiosErr.response.data.error.message)
      } else if (axiosErr.response?.data?.detail) {
        setApiError(axiosErr.response.data.detail)
      } else {
        setApiError("Login failed. Check your credentials or network status.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFillCredentials = (email: string, pass: string) => {
    setValue("email", email)
    setValue("password", pass)
  }

  return (
    <div className="login-gradient-mesh login-dot-grid flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-xl space-y-4">
        <LoginDebitCard>
          <div className="space-y-5">
            {isSessionExpired && (
              <div className="flex items-start gap-3 rounded-md border border-warning/20 bg-warning-muted p-3 text-sm text-warning-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>Your session has expired. Please log in again to continue.</span>
              </div>
            )}

            {apiError && (
              <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{apiError}</span>
              </div>
            )}

            <form id="login-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative rounded-md focus-within:ring-2 focus-within:ring-primary/20">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    disabled={isLoading}
                    placeholder="name@paisavasool.com"
                    className="border-border/80 bg-background/50 pl-9"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" aria-hidden />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative rounded-md focus-within:ring-2 focus-within:ring-primary/20">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="border-border/80 bg-background/50 pl-9 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" aria-hidden />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </form>
          </div>
        </LoginDebitCard>

        <Button
          type="submit"
          form="login-form"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          Sign in
          {!isLoading && <ArrowRight className="h-4 w-4" aria-hidden />}
        </Button>

        <div className="rounded-xl border border-border/40 bg-card/60 px-3 py-2 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setShowTestAccounts(!showTestAccounts)}
            aria-expanded={showTestAccounts}
            className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-primary" aria-hidden />
              Demo / test accounts
            </span>
            {showTestAccounts ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>

          {showTestAccounts && (
            <div
              className={cn(
                "mt-2 space-y-2 rounded-md bg-muted/10 p-2.5",
                "motion-reduce:animate-none animate-in fade-in slide-in-from-top-1 duration-200"
              )}
            >
              <div className="flex items-center justify-between gap-3 rounded-md bg-card/60 p-2.5">
                <div className="min-w-0 text-left">
                  <span className="block text-sm font-medium text-foreground">
                    Administrator account
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    admin@paisavasool.com
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleFillCredentials("admin@paisavasool.com", "ChangeMe123!")}
                >
                  Auto-fill
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
