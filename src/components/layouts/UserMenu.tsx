import React from "react"
import { LogOut, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface UserMenuProps {
  email?: string
  role?: string
  onLogout: () => void
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

export const UserMenu: React.FC<UserMenuProps> = ({
  email,
  role,
  onLogout,
}) => {
  return (
    <div className="border-t border-border p-4">
      <div className="mb-3 flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{email}</p>
          <div className="mt-1">
            <Badge variant={getRoleBadgeVariant(role)} shape="pill" className="text-[11px]">
              {formatRoleName(role)}
            </Badge>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="w-full justify-center text-muted-foreground"
      >
        <LogOut className="mr-2 h-4 w-4" aria-hidden />
        Sign out
      </Button>
    </div>
  )
}
