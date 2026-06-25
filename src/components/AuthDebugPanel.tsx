import React, { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useLocation } from "react-router-dom"
import { RootState } from "@/app/store"
import { api } from "@/lib/axios"
import { setCredentials, clearCredentials } from "@/features/auth/slices/authSlice"
import { getCookie } from "@/lib/cookies"
import { authService } from "@/features/auth/services/authService"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const AuthDebugPanel: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const location = useLocation()
  const dispatch = useDispatch()

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user?.exp) {
      setSecondsLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      const diff = Math.floor(user.exp - Date.now() / 1000)
      setSecondsLeft(diff > 0 ? diff : 0)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await api.post("/auth/refresh")
      const freshUser = await authService.getMe()

      if (user) {
        const expiresAtStr = getCookie("access_token_expires_at")
        const exp = expiresAtStr
          ? parseInt(expiresAtStr, 10)
          : Math.floor(Date.now() / 1000) + 2700

        dispatch(
          setCredentials({
            sub: freshUser.id,
            email: freshUser.email,
            role: freshUser.role.role_name,
            is_active: freshUser.is_active,
            exp,
          })
        )
      }
    } catch (err) {
      console.error("Manual refresh failed", err)
      dispatch(clearCredentials())
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-popover transition-colors hover:bg-primary/90"
        title="Open Auth Debug Panel"
      >
        <span className="font-mono text-xs font-medium">DEBUG</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-popover">
      <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
        <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Auth service debug
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="font-mono text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          [Minimize]
        </button>
      </div>

      <div className="space-y-2 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Auth state</span>
          <span
            className={cn(
              "font-medium",
              isAuthenticated ? "text-success" : "text-destructive"
            )}
          >
            {isAuthenticated ? "Authenticated" : "Unauthenticated"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Current route</span>
          <span className="font-medium text-info">{location.pathname}</span>
        </div>

        {isAuthenticated && user ? (
          <>
            <div className="flex justify-between border-t border-dashed border-border pt-1">
              <span className="text-muted-foreground">User ID</span>
              <span className="max-w-[160px] truncate text-foreground" title={user.sub}>
                {user.sub}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="max-w-[160px] truncate text-foreground" title={user.email}>
                {user.email}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="rounded bg-primary/10 px-1 py-0.5 font-medium text-primary">
                {user.role}
              </span>
            </div>

            <div className="flex justify-between border-t border-dashed border-border pt-1">
              <span className="text-muted-foreground">Token TTL</span>
              <span
                className={cn(
                  "font-medium",
                  secondsLeft !== null && secondsLeft < 60
                    ? "animate-pulse text-destructive"
                    : "text-success"
                )}
              >
                {secondsLeft !== null
                  ? secondsLeft > 0
                    ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
                    : "Expired"
                  : "N/A"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Cookie status</span>
              <span className="text-success">HTTPOnly secure</span>
            </div>

            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full font-mono text-xs"
                onClick={handleManualRefresh}
                loading={isRefreshing}
              >
                {isRefreshing ? "Refreshing…" : "Trigger silent refresh"}
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-md bg-destructive/10 p-2 text-center text-destructive">
            No active session detected. Please log in to inspect JWT variables.
          </div>
        )}
      </div>
    </div>
  )
}
