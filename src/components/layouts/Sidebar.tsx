import React, { useRef } from "react"
import { CreditCard, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFocusTrap } from "@/lib/use-focus-trap"
import { useOverlay } from "@/lib/use-overlay"
import { SidebarNav } from "./SidebarNav"
import { UserMenu } from "./UserMenu"
import type { NavItem } from "./navigation"

interface SidebarProps {
  items: NavItem[]
  email?: string
  role?: string
  onLogout: () => void
  onNavigate?: () => void
  className?: string
}

function SidebarBrand() {
  return (
    <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
      <span className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
        <CreditCard className="h-5 w-5 text-primary" aria-hidden />
        Paisa Vasool
      </span>
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  email,
  role,
  onLogout,
  onNavigate,
  className,
}) => {
  return (
    <aside
      className={cn(
        "flex w-60 flex-col border-r border-border bg-card",
        className
      )}
    >
      <SidebarBrand />
      <SidebarNav items={items} onNavigate={onNavigate} />
      <UserMenu email={email} role={role} onLogout={onLogout} />
    </aside>
  )
}

interface MobileSidebarProps extends SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  items,
  email,
  role,
  onLogout,
}) => {
  const asideRef = useRef<HTMLElement>(null)
  useOverlay(isOpen, (open) => {
    if (!open) onClose()
  })
  useFocusTrap(asideRef, isOpen)

  if (!isOpen) return null

  const handleNavigate = () => onClose()

  const handleLogout = () => {
    onClose()
    onLogout()
  }

  return (
    <div className="fixed inset-0 z-40 flex md:hidden">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={asideRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="relative flex w-60 max-w-[85vw] flex-col border-r border-border bg-card animate-in slide-in-from-left duration-200"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          <span className="flex items-center gap-2 text-base font-semibold text-foreground">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden />
            Paisa Vasool
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarNav items={items} onNavigate={handleNavigate} />
        <UserMenu email={email} role={role} onLogout={handleLogout} />
      </aside>
    </div>
  )
}
