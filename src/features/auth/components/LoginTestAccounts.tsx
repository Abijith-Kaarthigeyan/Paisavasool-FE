import { useState } from "react"
import { KeyRound, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const DEMO_ACCOUNTS = [
  {
    label: "Administrator account",
    email: "admin@paisavasool.com",
    password: "ChangeMe123!",
    role: "ADMIN" as const,
  },
] as const

interface LoginTestAccountsProps {
  onAutoFill: (email: string, password: string) => void
  onQuickSignIn: (email: string, password: string) => void
  disabled?: boolean
}

export function LoginTestAccounts({
  onAutoFill,
  onQuickSignIn,
  disabled = false,
}: LoginTestAccountsProps) {
  const [expanded, setExpanded] = useState(false)

  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 px-3 py-2 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="flex items-center gap-2">
          <KeyRound className="h-3.5 w-3.5 text-primary" aria-hidden />
          Demo / test accounts
          <Badge variant="neutral" className="px-1.5 py-0 text-[10px]">
            Development only
          </Badge>
        </span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>

      {expanded && (
        <div
          className={cn(
            "mt-2 space-y-2 rounded-md bg-muted/10 p-2.5",
            "motion-reduce:animate-none animate-in fade-in slide-in-from-top-1 duration-200"
          )}
        >
          {DEMO_ACCOUNTS.map((account) => (
            <div
              key={account.email}
              className="flex flex-col gap-2 rounded-md bg-card/60 p-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{account.label}</span>
                  <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                    {account.role}
                  </Badge>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{account.email}</span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onAutoFill(account.email, account.password)}
                >
                  Auto-fill
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onQuickSignIn(account.email, account.password)}
                >
                  Sign in
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
