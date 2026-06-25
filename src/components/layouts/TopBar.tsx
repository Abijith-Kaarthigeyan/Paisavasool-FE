import React from "react"
import { Menu } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TopBarProps {
  email?: string
  role?: string
  onMenuOpen: () => void
}

function getRoleBadgeVariant(roleName: string | undefined) {
  if (roleName === "ADMIN") return "default" as const
  if (roleName === "FINANCE_MANAGER") return "success" as const
  return "warning" as const
}

function formatRoleName(roleName: string | undefined) {
  if (!roleName) return ""
  return roleName.replace("_", " ")
}

export const TopBar: React.FC<TopBarProps> = ({ email, role, onMenuOpen }) => {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="md"
          onClick={onMenuOpen}
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Accounts Receivable Assistant
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden flex-col items-end md:flex">
          <span className="text-xs text-muted-foreground">Signed in as</span>
          <span className="text-xs font-medium text-foreground">{email}</span>
        </div>
        <div className="hidden h-5 w-px bg-border md:block" aria-hidden />
        <Badge variant={getRoleBadgeVariant(role)} shape="pill" className="text-[11px]">
          {formatRoleName(role)}
        </Badge>
      </div>
    </header>
  )
}
