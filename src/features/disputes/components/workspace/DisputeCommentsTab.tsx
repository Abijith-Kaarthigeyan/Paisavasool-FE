import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DisputeComment } from "../../types"

interface DisputeCommentsTabProps {
  comments: DisputeComment[]
  isLoading?: boolean
  isSubmitting?: boolean
  onSendComment: (comment: string, commentType: "INTERNAL" | "CUSTOMER") => Promise<void>
}

export function DisputeCommentsTab({
  comments,
  isLoading,
  isSubmitting,
  onSendComment,
}: DisputeCommentsTabProps) {
  const [commentText, setCommentText] = useState("")
  const [commentType, setCommentType] = useState<"INTERNAL" | "CUSTOMER">("INTERNAL")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    await onSendComment(commentText, commentType)
    setCommentText("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : comments.length === 0 ? (
            <EmptyState
              title="No comments yet"
              description="Start the thread with an internal note or customer message."
              className="py-6"
            />
          ) : (
            comments.map((c) => {
              const isInternal = c.comment_type === "INTERNAL"
              const isSystem = c.comment_type === "SYSTEM"

              return (
                <div
                  key={c.id}
                  className={cn(
                    "max-w-[85%] rounded-lg border p-3 text-sm",
                    isSystem
                      ? "mx-auto w-full border-border bg-muted/40 text-center text-muted-foreground"
                      : isInternal
                        ? "ml-0 border-warning/20 bg-warning-muted/20"
                        : "ml-auto border-primary/20 bg-primary/[0.03]"
                  )}
                >
                  {!isSystem && (
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{c.created_by_name || "Associate"}</span>
                      <Badge variant={isInternal ? "warning" : "default"} shape="pill">
                        {c.comment_type}
                      </Badge>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                  {!isSystem && (
                    <time className="mt-1.5 block text-right text-xs tabular-nums text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </time>
                  )}
                </div>
              )
            })
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border pt-4">
          <Select
            value={commentType}
            onChange={(e) => setCommentType(e.target.value as "INTERNAL" | "CUSTOMER")}
            className="w-36"
          >
            <option value="INTERNAL">Internal</option>
            <option value="CUSTOMER">To customer</option>
          </Select>
          <Input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment or validation update…"
            className="flex-1"
          />
          <Button
            type="submit"
            variant="icon"
            size="md"
            disabled={isSubmitting || !commentText.trim()}
            aria-label="Send comment"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
