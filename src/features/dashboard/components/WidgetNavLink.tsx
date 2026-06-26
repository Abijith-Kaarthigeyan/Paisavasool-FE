import React from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface WidgetNavLinkProps {
  to: string
  children: React.ReactNode
  className?: string
}

/** Inline primary text link with arrow — arrow nudges right on hover. */
export const WidgetNavLink: React.FC<WidgetNavLinkProps> = ({ to, children, className }) => {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/75",
        className
      )}
    >
      {children}
      <ArrowRight
        className="ml-1 h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  )
}
