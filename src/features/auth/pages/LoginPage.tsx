import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDispatch, useSelector } from "react-redux"
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { loginSchema, LoginRequest } from "@/features/auth/types"
import { authService } from "@/features/auth/services/authService"
import { setCredentials, clearCredentials } from "@/features/auth/slices/authSlice"
import { getCookie } from "@/lib/cookies"
import { RootState } from "@/app/store"
import { getPostLoginPath } from "@/lib/navigation"
import { LoginDebitCard } from "@/features/auth/components/LoginDebitCard"
import { LoginTestAccounts } from "@/features/auth/components/LoginTestAccounts"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FocusedField = "email" | "password" | null

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<FocusedField>(null)

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
    return <Navigate to={getPostLoginPath(location.state?.from)} replace />
  }

  const performLogin = async (data: LoginRequest) => {
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
      navigate(getPostLoginPath(location.state?.from))
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

  const onSubmit = async (data: LoginRequest) => {
    await performLogin(data)
  }

  const handleAutoFill = (email: string, password: string) => {
    setValue("email", email)
    setValue("password", password)
  }

  const handleQuickSignIn = async (email: string, password: string) => {
    setValue("email", email)
    setValue("password", password)
    await performLogin({ email, password })
  }

  const emailField = register("email")
  const passwordField = register("password")

  const staggerClass =
    "motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-1 duration-500 fill-mode-both"

  return (
    <div className="login-gradient-mesh login-dot-grid login-spotlight login-blob-layer login-rupee-watermark relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative z-10 w-full max-w-[38rem] space-y-4">
        <LoginDebitCard
          shake={!!apiError}
          footer={
            <Button
              type="submit"
              form="login-form"
              variant="primary"
              size="lg"
              loading={isLoading}
              className={cn("group w-full active:scale-[0.98]", staggerClass, "delay-300")}
            >
              {isLoading ? "Signing in…" : "Sign in"}
              {!isLoading && (
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              )}
            </Button>
          }
        >
          <div className="space-y-5">
            {isSessionExpired && (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-md border border-warning/20 bg-warning-muted p-3 text-sm text-warning-foreground",
                  staggerClass
                )}
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>Your session has expired. Please log in again to continue.</span>
              </div>
            )}

            {apiError && (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive",
                  staggerClass
                )}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{apiError}</span>
              </div>
            )}

            <form id="login-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className={cn("space-y-2", staggerClass, "delay-100")}>
                <Label
                  htmlFor="email"
                  className={cn(
                    "transition-colors",
                    focusedField === "email" && "text-primary"
                  )}
                >
                  Email address
                </Label>
                <div
                  className={cn(
                    "relative rounded-md border border-transparent transition-colors",
                    "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
                  )}
                >
                  <Mail
                    className={cn(
                      "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                      focusedField === "email" ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    disabled={isLoading}
                    placeholder="name@paisavasool.com"
                    className="border-border/80 bg-background/50 pl-9"
                    {...emailField}
                    onFocus={() => setFocusedField("email")}
                    onBlur={(e) => {
                      setFocusedField((f) => (f === "email" ? null : f))
                      emailField.onBlur(e)
                    }}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" aria-hidden />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className={cn("space-y-2", staggerClass, "delay-200")}>
                <Label
                  htmlFor="password"
                  className={cn(
                    "transition-colors",
                    focusedField === "password" && "text-primary"
                  )}
                >
                  Password
                </Label>
                <div
                  className={cn(
                    "relative rounded-md border border-transparent transition-colors",
                    "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20"
                  )}
                >
                  <Lock
                    className={cn(
                      "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                      focusedField === "password" ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="border-border/80 bg-background/50 pl-9 pr-10"
                    {...passwordField}
                    onFocus={() => setFocusedField("password")}
                    onBlur={(e) => {
                      setFocusedField((f) => (f === "password" ? null : f))
                      passwordField.onBlur(e)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 transition-opacity" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4 transition-opacity" aria-hidden />
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

        <LoginTestAccounts
          onAutoFill={handleAutoFill}
          onQuickSignIn={handleQuickSignIn}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
