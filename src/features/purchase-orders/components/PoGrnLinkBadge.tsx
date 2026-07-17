import { Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PoGrnLinkBadgeProps {
  linkedGrnCount?: number | null
  className?: string
}

export function PoGrnLinkBadge({ linkedGrnCount = 0, className }: PoGrnLinkBadgeProps) {
  if (!linkedGrnCount || linkedGrnCount <= 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span
      className={cn("inline-flex items-center justify-center text-success", className)}
      title={`${linkedGrnCount} linked GRN${linkedGrnCount === 1 ? "" : "s"}`}
    >
      <Link2 className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">
        {linkedGrnCount} linked GRN{linkedGrnCount === 1 ? "" : "s"}
      </span>
    </span>
  )
}
