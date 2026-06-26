import React from "react"
import { QuickUploadMenu } from "./QuickUploadMenu"
import { cn } from "@/lib/utils"

interface DashboardGreetingProps {
  displayName: string
  className?: string
}

export const DashboardGreeting: React.FC<DashboardGreetingProps> = ({
  displayName,
  className,
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
      <QuickUploadMenu />
    </div>
  )
}

export function getDisplayNameFromEmail(email: string | undefined): string {
  if (!email) return "there"
  const localPart = email.split("@")[0] ?? email
  const firstSegment = localPart.split(/[._-]/)[0] ?? localPart
  if (!firstSegment) return "there"
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1).toLowerCase()
}
