import React from "react"
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

/** Full-height page shell — fits viewport without outer scroll. */
export const PageLayout: React.FC<PageLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-3 overflow-hidden", className)}>
      {children}
    </div>
  )
}

interface PageBodyProps {
  children: React.ReactNode
  className?: string
}

/** Scrollable main content area within a PageLayout. */
export const PageBody: React.FC<PageBodyProps> = ({ children, className }) => {
  return (
    <div className={cn("min-h-0 flex-1 overflow-auto", className)}>
      {children}
    </div>
  )
}
