import React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const variantStyles = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95",
  secondary:
    "border border-border bg-background text-foreground hover:bg-muted active:bg-muted/80",
  ghost:
    "text-foreground hover:bg-muted active:bg-muted/80",
  danger:
    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/95",
  success:
    "bg-success text-white shadow-sm hover:bg-success/90 active:bg-success/95",
  icon:
    "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
} as const

const sizeStyles = {
  sm: "h-8 min-w-[4rem] px-3 text-xs gap-1.5",
  md: "h-10 min-w-[5rem] px-4 text-sm gap-2",
  lg: "h-12 min-w-[5.5rem] px-5 text-sm gap-2",
  xl: "h-14 min-w-[6rem] px-6 text-base gap-2.5",
} as const

const iconSizeStyles = {
  sm: "h-8 w-8 min-w-8 p-0",
  md: "h-10 w-10 min-w-10 p-0",
  lg: "h-12 w-12 min-w-12 p-0",
  xl: "h-14 w-14 min-w-14 p-0",
} as const

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const isIcon = variant === "icon"
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
          isIcon ? iconSizeStyles[size] : sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2
            className={cn("shrink-0 animate-spin", isIcon ? "h-4 w-4" : "h-4 w-4")}
            aria-hidden
          />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
