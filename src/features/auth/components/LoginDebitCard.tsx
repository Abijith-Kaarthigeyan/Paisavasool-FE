import type { ReactNode } from "react"
import { CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoginDebitCardProps {
  children: ReactNode
  className?: string
}

export function LoginDebitCard({ children, className }: LoginDebitCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-xl overflow-hidden rounded-3xl border-2 border-primary/25 bg-card/90 shadow-popover backdrop-blur-xl",
        "motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
        className
      )}
    >
      <div className="border-b border-border/60 bg-primary/[0.03] px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              <span className="text-foreground">Paisa </span>
              <span className="text-primary">Vasool</span>
            </h1>
            <p className="text-sm text-muted-foreground">Accounts Receivable Assistant</p>
          </div>
        </div>
      </div>

      <div className="bg-card/80 px-5 py-6 sm:px-8 sm:py-8">{children}</div>
    </div>
  )
}
