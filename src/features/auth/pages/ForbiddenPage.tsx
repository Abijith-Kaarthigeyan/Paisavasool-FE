import React from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { ShieldAlert } from "lucide-react"
import { logout } from "@/features/auth/slices/authSlice"
import { authService } from "@/features/auth/services/authService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      dispatch(logout())
      navigate("/login")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md text-center shadow-card">
        <CardHeader className="items-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Error 403</p>
            <CardTitle className="text-xl">Access denied</CardTitle>
            <CardDescription>
              You do not have the required permissions or role privileges to view this page.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="primary" onClick={handleGoBack} className="w-full">
            Go back
          </Button>
          <Button variant="secondary" onClick={handleLogout} className="w-full">
            Log out and sign in again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
