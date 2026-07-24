import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { useFocusTrap } from "@/lib/use-focus-trap"

type PopoverSide = "bottom" | "top"
type PopoverAlign = "start" | "center" | "end"

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  contentId: string
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext(component: string): PopoverContextValue {
  const ctx = useContext(PopoverContext)
  if (!ctx) {
    throw new Error(`${component} must be used within <Popover>`)
  }
  return ctx
}

export interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const triggerRef = useRef<HTMLElement | null>(null)
  const contentId = useId()

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentId }}>
      {children}
    </PopoverContext.Provider>
  )
}

export interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

export function PopoverTrigger({
  asChild,
  children,
  className,
  onClick,
  ...props
}: PopoverTriggerProps) {
  const { open, setOpen, triggerRef, contentId } = usePopoverContext("PopoverTrigger")

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (!event.defaultPrevented) setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>
    return (
      <span className="contents">
        {React.cloneElement(child, {
          ...props,
          className: cn(String(child.props.className ?? ""), className),
          "aria-haspopup": "dialog",
          "aria-expanded": open,
          "aria-controls": open ? contentId : undefined,
          onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
            const childOnClick = child.props.onClick as
              | ((e: React.MouseEvent<HTMLButtonElement>) => void)
              | undefined
            childOnClick?.(event)
            handleClick(event)
          },
          ref: (node: HTMLElement | null) => {
            triggerRef.current = node
          },
        })}
      </span>
    )
  }

  return (
    <button
      type="button"
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: PopoverSide
  align?: PopoverAlign
  sideOffset?: number
}

function computePosition(
  trigger: DOMRect,
  content: DOMRect,
  side: PopoverSide,
  align: PopoverAlign,
  sideOffset: number
) {
  let top = side === "bottom" ? trigger.bottom + sideOffset : trigger.top - content.height - sideOffset

  let left = trigger.left
  if (align === "center") left = trigger.left + trigger.width / 2 - content.width / 2
  if (align === "end") left = trigger.right - content.width

  const padding = 8
  left = Math.min(Math.max(padding, left), window.innerWidth - content.width - padding)
  top = Math.min(Math.max(padding, top), window.innerHeight - content.height - padding)

  return { top, left }
}

export function PopoverContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  ...props
}: PopoverContentProps) {
  const { open, setOpen, triggerRef, contentId } = usePopoverContext("PopoverContent")
  const contentRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  useFocusTrap(contentRef, open)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const content = contentRef.current
    if (!trigger || !content) return
    setCoords(
      computePosition(
        trigger.getBoundingClientRect(),
        content.getBoundingClientRect(),
        side,
        align,
        sideOffset
      )
    )
  }, [align, side, sideOffset, triggerRef])

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return
    }
    updatePosition()
  }, [open, updatePosition, children])

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (contentRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
      }
    }

    const handleReposition = () => updatePosition()

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("resize", handleReposition)
    window.addEventListener("scroll", handleReposition, true)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("resize", handleReposition)
      window.removeEventListener("scroll", handleReposition, true)
      previouslyFocused?.focus?.()
    }
  }, [open, setOpen, triggerRef, updatePosition])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div
      ref={contentRef}
      id={contentId}
      role="dialog"
      aria-modal="false"
      style={{
        position: "fixed",
        top: coords?.top ?? -9999,
        left: coords?.left ?? -9999,
        visibility: coords ? "visible" : "hidden",
      }}
      className={cn(
        "z-[80] w-64 rounded-md border border-border bg-card p-3 text-sm shadow-popover outline-hidden",
        "animate-in fade-in zoom-in-95 duration-150",
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}
