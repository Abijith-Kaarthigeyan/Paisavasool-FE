import { useEffect, useState, type ReactNode } from "react"
import { CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const TAGLINES = ["Collect faster.", "Disputes, resolved.", "Cash flow, visible."] as const

interface LoginDebitCardProps {
  children: ReactNode
  footer?: ReactNode
  className?: string
  shake?: boolean
}

function EmvChip() {
  return (
    <svg
      viewBox="0 0 36 28"
      className="h-8 w-10 shrink-0"
      aria-hidden
      fill="none"
    >
      <rect
        x="1"
        y="1"
        width="34"
        height="26"
        rx="4"
        className="fill-[#D4AF37]/80 stroke-[#B8960C]/60"
        strokeWidth="1"
      />
      <path
        d="M8 8h6v4H8zm14 0h6v4h-6zM8 16h6v4H8zm14 0h6v4h-6z"
        className="fill-[#B8960C]/50"
      />
      <path d="M14 8h8v12h-8z" className="fill-[#C9A227]/40" />
    </svg>
  )
}

export function LoginDebitCard({ children, footer, className, shake }: LoginDebitCardProps) {
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setTaglineIndex((i) => (i + 1) % TAGLINES.length)
    }, 4000)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  return (
    <div
      className={cn(
        "login-debit-card-shape w-full overflow-hidden rounded-3xl border-2 border-primary/25 bg-card/90 shadow-popover backdrop-blur-xl",
        "motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
        shake && "login-error-shake",
        className
      )}
    >
      <div className="login-holographic-band relative border-b border-border/60 px-6 py-6 sm:px-8 sm:py-7">
        <span
          className="login-card-watermark pointer-events-none absolute right-6 top-6 select-none text-sm sm:right-8 sm:text-base"
          aria-hidden
        >
          •••• •••• •••• 4242
        </span>

        <div className="relative flex flex-col gap-4">
          <EmvChip />

          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <h1 className="login-wordmark text-xl font-bold tracking-tight sm:text-2xl">
                <span className="text-foreground">Paisa </span>
                <span className="text-primary">Vasool</span>
              </h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Accounts Receivable Assistant
              </p>
            </div>
          </div>

          <p
            className={cn(
              "text-sm text-primary/80",
              !reduceMotion && "motion-reduce:animate-none animate-in fade-in duration-500"
            )}
            key={taglineIndex}
          >
            {TAGLINES[taglineIndex]}
          </p>
        </div>
      </div>

      <div className="bg-card/80 px-6 py-6 sm:px-8 sm:py-7">
        {children}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  )
}
