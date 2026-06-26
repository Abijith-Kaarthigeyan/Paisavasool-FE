import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileText, CreditCard, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const QuickUploadMenu: React.FC = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        size="md"
        aria-label="Quick upload actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className="h-10 w-10 min-w-10 rounded-full p-0"
      >
        <Plus className="h-5 w-5" aria-hidden />
      </Button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-card shadow-popover",
            "animate-in fade-in zoom-in-95 duration-150"
          )}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleNavigate("/invoice-upload")}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
            Upload Invoice
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleNavigate("/payment-upload")}
            className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden />
            Upload Payment
          </button>
        </div>
      )}
    </div>
  )
}
