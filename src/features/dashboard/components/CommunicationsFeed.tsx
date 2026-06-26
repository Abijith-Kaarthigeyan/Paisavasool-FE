import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import { useReminderHistory } from "@/features/collections/hooks/useCollections"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

interface FeedItem {
  id: string
  type: "sent" | "received"
  from: string
  subject: string
  date: string
  link: string
}

function formatFeedDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

interface CommunicationsFeedProps {
  className?: string
  maxItems?: number
  /** Match the adjacent chart height on dashboard layouts. */
  height?: string
}

export const CommunicationsFeed: React.FC<CommunicationsFeedProps> = ({
  className,
  maxItems = 4,
  height = "h-[300px]",
}) => {
  const { data: reminders = [], isLoading } = useReminderHistory()

  const feedItems = useMemo<FeedItem[]>(() => {
    return reminders
      .map((r) => ({
        id: `reminder-${r.id}`,
        type: "sent" as const,
        from: r.sent_to || "Collections",
        subject: r.subject,
        date: r.sent_at || r.created_at,
        link: r.collection_case_id
          ? `/collections/${r.collection_case_id}`
          : "/collections/reminders",
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxItems)
  }, [reminders, maxItems])

  return (
    <Card className={cn("flex min-h-0 flex-col border-border shadow-card", height, className)}>
      <CardHeader className="shrink-0 border-b border-border px-3 py-2">
        <CardTitle className="text-sm">Communications</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden px-3 py-1 hover:overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : feedItems.length === 0 ? (
          <EmptyState
            title="No communications yet"
            description="Collection reminders and dunning emails will appear here."
            className="py-4"
          />
        ) : (
          <ul className="divide-y divide-border">
            {feedItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.link}
                  className="flex items-center gap-2 py-1.5 transition-colors hover:bg-muted/40 -mx-1 rounded-md px-1"
                >
                  <Badge
                    variant={item.type === "sent" ? "info" : "default"}
                    className="shrink-0 px-1 py-0 text-[9px] font-semibold uppercase"
                  >
                    {item.type === "sent" ? "Sent" : "In"}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{item.subject}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {item.from} · {formatFeedDate(item.date)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
