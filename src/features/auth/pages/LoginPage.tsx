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
import { getDashboardPath, getPostLoginPath } from "@/lib/navigation"
import { AntigravityParticles } from "@/features/auth/components/AntigravityParticles"
import { PaisaVasoolBrand } from "@/features/auth/components/PaisaVasoolBrand"
import { LoginTypewriterHeadline } from "@/features/auth/components/LoginTypewriterHeadline"
import { LoginTestAccounts } from "@/features/auth/components/LoginTestAccounts"
import { Mail, Lock, Eye, EyeOff, AlertCircle, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, user, voluntaryLogout } = useSelector(
    (state: RootState) => state.auth
  )

  const resolvePostLoginPath = () =>
    voluntaryLogout ? getDashboardPath() : getPostLoginPath(location.state?.from)

  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    return <Navigate to={resolvePostLoginPath()} replace />
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

      const redirectPath = resolvePostLoginPath()
      dispatch(setCredentials(tokenPayload))
      navigate(redirectPath)
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

  return (
    <div className="ag-login relative min-h-screen overflow-hidden bg-white text-[#1f1f1f]">
      <AntigravityParticles />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div
          className={cn(
            "flex w-full max-w-4xl flex-col items-center text-center",
            apiError && "ag-login-shake"
          )}
        >
          <PaisaVasoolBrand />

          <LoginTypewriterHeadline />

          <div className="mt-10 w-full max-w-3xl space-y-4 sm:mt-12">
            {isSessionExpired && (
              <div className="ag-alert flex items-start justify-center gap-2 text-sm text-[#111111]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" aria-hidden />
                <span>Your session has expired. Please log in again to continue.</span>
              </div>
            )}

            {apiError && (
              <div className="ag-alert flex items-start justify-center gap-2 text-sm text-[#111111]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" aria-hidden />
                <span>{apiError}</span>
              </div>
            )}

            <form
              id="login-form"
              className="flex w-full flex-col items-center gap-5"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:items-center">
                <div className="ag-pill ag-pill-light w-full sm:w-[min(100%,15rem)]">
                  <Mail className="h-4 w-4 shrink-0 text-[#111111]" aria-hidden />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    placeholder="Email"
                    className="ag-pill-input ag-pill-input-light"
                    {...emailField}
                  />
                </div>

                <div className="ag-pill ag-pill-light w-full sm:w-[min(100%,15rem)]">
                  <Lock className="h-4 w-4 shrink-0 text-[#111111]" aria-hidden />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={isLoading}
                    placeholder="Password"
                    className="ag-pill-input ag-pill-input-light"
                    {...passwordField}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="ag-pill-toggle"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              {(errors.email || errors.password) && (
                <div className="flex flex-col items-center gap-1 text-sm text-[#111111]">
                  {errors.email && (
                    <p className="flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-[#111111]" aria-hidden />
                      {errors.email.message}
                    </p>
                  )}
                  {errors.password && (
                    <p className="flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-[#111111]" aria-hidden />
                      {errors.password.message}
                    </p>
                  )}
                </div>
              )}

              <button type="submit" disabled={isLoading} className="ag-login-btn">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="relative z-10 mt-8 w-full max-w-2xl">
          <LoginTestAccounts
            onAutoFill={handleAutoFill}
            onQuickSignIn={handleQuickSignIn}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
