import React from "react"
import { QuickUploadMenu } from "./QuickUploadMenu"
import { cn } from "@/lib/utils"

interface DashboardGreetingProps {
  displayName: string
  className?: string
  action?: React.ReactNode
}

export const DashboardGreeting: React.FC<DashboardGreetingProps> = ({
  displayName,
  className,
  action = <QuickUploadMenu />,
}) => {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center",
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Hello {displayName},
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground md:text-base">
          Here&apos;s what needs your attention today
        </p>
      </div>
      {action}
    </div>
  )
}

export function getGreetingName(firstName: string | undefined, email?: string): string {
  if (firstName?.trim()) return firstName.trim()
  if (!email) return "there"
  const localPart = email.split("@")[0] ?? email
  const firstSegment = localPart.split(/[._-]/)[0] ?? localPart
  if (!firstSegment) return "there"
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1).toLowerCase()
}
