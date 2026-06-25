import React from "react"
import { Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfidenceMeter } from "@/components/ui/confidence-meter"

const statusConfig = {
  idle: { label: "Idle", variant: "neutral" as const },
  running: { label: "Running", variant: "ai" as const },
  complete: { label: "Complete", variant: "success" as const },
  error: { label: "Error", variant: "destructive" as const },
}

export interface AiAgentCardProps {
  agentName: string
  stage?: string
  stageLabel?: string
  confidence?: number
  progress?: number
  status?: keyof typeof statusConfig
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function AiAgentCard({
  agentName,
  stage,
  stageLabel = "Current stage",
  confidence,
  progress,
  status = "idle",
  children,
  action,
  className,
}: AiAgentCardProps) {
  const statusMeta = statusConfig[status]
  const showProgress = progress !== undefined
  const clampedProgress = showProgress ? Math.min(100, Math.max(0, progress)) : 0

  return (
    <Card className={cn("border-primary/20 bg-primary/[0.02]", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden
            >
              {status === "running" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Bot className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">{agentName}</CardTitle>
              <CardDescription>AI agent recommendation</CardDescription>
            </div>
          </div>
          <Badge variant={statusMeta.variant} shape="pill">
            {statusMeta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {stage && (
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">{stageLabel}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{stage}</p>
          </div>
        )}

        {confidence !== undefined && (
          <ConfidenceMeter value={confidence} label="Confidence" size="sm" />
        )}

        {showProgress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Progress</span>
              <span className="font-semibold tabular-nums text-foreground">
                {clampedProgress}%
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={clampedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
          </div>
        )}

        {children}

        {action && <div className="pt-1">{action}</div>}
      </CardContent>
    </Card>
  )
}
