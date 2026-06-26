import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import type { DisputeCommunication } from "../../types"
import { CommunicationThreadItem } from "./CommunicationThreadItem"

interface DisputeCommunicationsTabProps {
  communications: DisputeCommunication[]
  customerEmail: string | null
  messageId?: string | null
  isLoading?: boolean
}

export function DisputeCommunicationsTab({
  communications,
  customerEmail,
  messageId,
  isLoading,
}: DisputeCommunicationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Communications</CardTitle>
        <CardDescription>
          Email thread — received messages on the left, sent messages on the right.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : communications.length === 0 ? (
          <EmptyState
            title="No correspondence"
            description="No communications have been recorded for this dispute."
            className="py-8"
          />
        ) : (
          <div className="space-y-6">
            {communications.map((comm, index) => (
              <CommunicationThreadItem
                key={comm.id}
                comm={comm}
                customerEmail={customerEmail}
                isFirst={index === 0}
                messageId={index === 0 ? messageId : undefined}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
