import type { ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  UserPlus,
  Zap,
} from "lucide-react"

export type ActivityTone = "default" | "primary" | "success" | "warning" | "destructive"

export interface DisputeActivityConfig {
  icon: ReactNode
  tone: ActivityTone
  label: string
}

export function getDisputeActivityConfig(activityType: string): DisputeActivityConfig {
  const type = activityType.toUpperCase()

  if (type.includes("CREATED") || type.includes("OPENED")) {
    return {
      icon: <Zap className="h-2.5 w-2.5" />,
      tone: "primary",
      label: "Dispute created",
    }
  }
  if (type.includes("ASSIGNED") || type.includes("REASSIGNED")) {
    return {
      icon: <UserPlus className="h-2.5 w-2.5" />,
      tone: "warning",
      label: "Assignment changed",
    }
  }
  if (type.includes("ESCALAT")) {
    return {
      icon: <AlertTriangle className="h-2.5 w-2.5" />,
      tone: "destructive",
      label: "Escalated",
    }
  }
  if (type.includes("SLA") && type.includes("PAUSE")) {
    return {
      icon: <PauseCircle className="h-2.5 w-2.5" />,
      tone: "warning",
      label: "SLA paused",
    }
  }
  if (type.includes("SLA") && (type.includes("RESUME") || type.includes("RESUMED"))) {
    return {
      icon: <PlayCircle className="h-2.5 w-2.5" />,
      tone: "success",
      label: "SLA resumed",
    }
  }
  if (type.includes("STATUS")) {
    return {
      icon: <Activity className="h-2.5 w-2.5" />,
      tone: "primary",
      label: "Status changed",
    }
  }
  if (type.includes("COMMENT")) {
    return {
      icon: <MessageSquare className="h-2.5 w-2.5" />,
      tone: "default",
      label: "Comment added",
    }
  }
  if (
    type.includes("ASSOCIATE") ||
    type.includes("DECISION") ||
    type.includes("APPROV") ||
    type.includes("REJECT")
  ) {
    return {
      icon: <CheckCircle2 className="h-2.5 w-2.5" />,
      tone: "success",
      label: "Associate decision",
    }
  }
  if (type.includes("MANUAL_CLOSE")) {
    return {
      icon: <CheckCircle2 className="h-2.5 w-2.5" />,
      tone: "success",
      label: "Manually closed",
    }
  }
  if (type.includes("RESOLV") || type.includes("CLOSED")) {
    return {
      icon: <CheckCircle2 className="h-2.5 w-2.5" />,
      tone: "success",
      label: "Resolved",
    }
  }

  return {
    icon: <Clock className="h-2.5 w-2.5" />,
    tone: "default",
    label: activityType.replace(/_/g, " "),
  }
}

const HIDDEN_METADATA_KEYS = new Set(["stack_trace", "raw_state", "workflow_state"])

export function formatActivityMetadata(
  metadata: Record<string, unknown> | null | undefined
): Array<{ key: string; value: string }> {
  if (!metadata || typeof metadata !== "object") return []

  return Object.entries(metadata)
    .filter(([key]) => !HIDDEN_METADATA_KEYS.has(key))
    .map(([key, value]) => ({
      key: key.replace(/_/g, " "),
      value:
        value == null
          ? "—"
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value),
    }))
    .filter((row) => row.value !== "—" && row.value !== "{}")
}
