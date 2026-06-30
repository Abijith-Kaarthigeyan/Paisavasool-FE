import React, { useCallback, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface SidebarTooltipProps {
  label: string
  children: React.ReactNode
  className?: string
}

/** Styled tooltip for collapsed sidebar icons (replaces native `title` tooltips). */
export function SidebarTooltip({ label, children, className }: SidebarTooltipProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

  const updatePosition = useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    })
  }, [])

  const show = useCallback(() => {
    updatePosition()
    setOpen(true)
  }, [updatePosition])

  const hide = useCallback(() => setOpen(false), [])

  return (
    <>
      <div
        ref={wrapperRef}
        className={cn("relative", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocusCapture={show}
        onBlurCapture={hide}
        aria-describedby={open ? tooltipId : undefined}
      >
        {children}
      </div>
      {open &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            style={{ top: position.top, left: position.left }}
            className={cn(
              "pointer-events-none fixed z-[100] -translate-y-1/2",
              "motion-reduce:animate-none animate-in fade-in slide-in-from-left-1 duration-150"
            )}
          >
            <div className="relative whitespace-nowrap rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg ring-1 ring-foreground/5">
              {label}
              <span
                className="absolute -left-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-b border-l border-border/80 bg-card"
                aria-hidden
              />
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
