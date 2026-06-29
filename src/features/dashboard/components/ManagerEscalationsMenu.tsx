import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, FolderOpen, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEscalatedCases } from "@/features/collections/hooks/useCollections"
import { useDisputes } from "@/features/disputes/hooks/useDisputes"
import { isTerminalDisputeStatus } from "@/features/disputes/utils/disputeFormatters"
import { cn } from "@/lib/utils"

const ESCALATION_ROUTES = {
  collection: "/collections/escalated",
  dispute: "/disputes/escalated",
} as const

export const ManagerEscalationsMenu: React.FC = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: escalatedCases = [] } = useEscalatedCases()
  const { data: disputes = [] } = useDisputes()

  const escalatedDisputeCount = useMemo(
    () =>
      disputes.filter(
        (d) => (d.status === "ESCALATED" || d.sla?.status === "BREACHED") && !isTerminalDisputeStatus(d.status)
      ).length,
    [disputes]
  )

  const collectionCount = escalatedCases.length
  const totalCount = collectionCount + escalatedDisputeCount

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const handleNavigate = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <Button
        type="button"
        size="md"
        aria-label="Escalations"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className="relative h-10 min-w-10 rounded-full px-3"
      >
        <AlertTriangle className="h-5 w-5" aria-hidden />
        {totalCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Escalation queues"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-popover animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-foreground">Escalations</p>
            <p className="text-[10px] text-muted-foreground">Jump to a queue to intervene</p>
          </div>
          <ul className="py-1">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate(ESCALATION_ROUTES.collection)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-hidden"
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning-muted text-warning">
                  <FolderOpen className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">Collection</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Reassign, override, or close cases
                  </span>
                </span>
                {collectionCount > 0 && (
                  <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-destructive">
                    {collectionCount}
                  </span>
                )}
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate(ESCALATION_ROUTES.dispute)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-hidden"
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                  <Scale className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">Dispute</span>
                  <span className="block text-[11px] text-muted-foreground">
                    SLA breaches needing manager action
                  </span>
                </span>
                {escalatedDisputeCount > 0 && (
                  <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-destructive">
                    {escalatedDisputeCount}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
