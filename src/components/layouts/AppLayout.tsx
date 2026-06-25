import React, { Suspense, useState } from "react"
import { useNavigate, Outlet } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/app/store"
import { clearCredentials } from "@/features/auth/slices/authSlice"
import { authService } from "@/features/auth/services/authService"
import { useToast } from "@/components/ui/toast"
import { Sidebar, MobileSidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { RouteContentSkeleton } from "./RouteContentSkeleton"
import { navigationItems, filterNavItemsForRole } from "./navigation"

export const AppLayout: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useSelector((state: RootState) => state.auth)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      dispatch(clearCredentials())
      toast({
        title: "Session ended",
        description: "You have been logged out successfully.",
        type: "success",
      })
      navigate("/login")
    }
  }

  const visibleNavItems = filterNavItemsForRole(navigationItems, user?.role)

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      <Sidebar
        items={visibleNavItems}
        email={user?.email}
        role={user?.role}
        onLogout={handleLogout}
        className="hidden md:flex"
      />

      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        items={visibleNavItems}
        email={user?.email}
        role={user?.role}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          email={user?.email}
          role={user?.role}
          onMenuOpen={() => setIsMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-background">
          <Suspense fallback={<RouteContentSkeleton />}>
            <div className="mx-auto max-w-7xl px-6 py-6 md:px-8 motion-reduce:animate-none animate-in fade-in duration-150">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
