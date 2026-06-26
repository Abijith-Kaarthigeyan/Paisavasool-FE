import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { DisputeActivity } from "../../types"
import {
  formatActivityMetadata,
  getDisputeActivityConfig,
} from "../../utils/disputeActivityConfig"

interface DisputeActivityTabProps {
  activities: DisputeActivity[]
  isLoading?: boolean
}

function ActivityMetadataBlock({ metadata }: { metadata: Record<string, unknown> }) {
  const [showTechnical, setShowTechnical] = useState(false)
  const rows = formatActivityMetadata(metadata)
  const hasStructured = rows.length > 0

  if (!hasStructured) {
    return (
      <div className="ml-6 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-0 text-xs text-muted-foreground"
          onClick={() => setShowTechnical((v) => !v)}
        >
          {showTechnical ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" aria-hidden />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" aria-hidden />
              Technical details
            </>
          )}
        </Button>
        {showTechnical && (
          <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        )}
      </div>
    )
  }

  return (
    <div className="ml-6 mt-2 space-y-2">
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between gap-4 py-0.5">
            <span className="capitalize text-muted-foreground">{row.key}</span>
            <span className="max-w-[65%] truncate text-right font-medium text-foreground">
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-0 text-xs text-muted-foreground"
        onClick={() => setShowTechnical((v) => !v)}
      >
        {showTechnical ? "Hide raw JSON" : "View raw JSON"}
      </Button>
      {showTechnical && (
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  )
}

export function DisputeActivityTab({ activities, isLoading }: DisputeActivityTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity timeline</CardTitle>
        <CardDescription>Chronological audit of the dispute lifecycle.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : activities.length === 0 ? (
          <EmptyState
            title="No activities"
            description="No activity has been recorded for this dispute yet."
            className="py-8"
          />
        ) : (
          <Timeline>
            {activities.map((act) => {
              const config = getDisputeActivityConfig(act.activity_type)
              return (
                <div key={act.id}>
                  <TimelineItem
                    icon={config.icon}
                    title={config.label}
                    timestamp={new Date(act.created_at).toLocaleString()}
                    tone={config.tone}
                  />
                  {act.activity_metadata && (
                    <ActivityMetadataBlock metadata={act.activity_metadata} />
                  )}
                </div>
              )
            })}
          </Timeline>
        )}
      </CardContent>
    </Card>
  )
}
