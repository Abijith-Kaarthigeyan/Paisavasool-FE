import React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuickUploadMenu } from "./QuickUploadMenu"
import { EmailPollButton } from "./EmailPollButton"
import { useEmailManualReview } from "@/features/email-intake/hooks/useEmailReviews"
import { asListItems } from "@/lib/table"

export const AssociateHeaderActions: React.FC = () => {
  const navigate = useNavigate()
  const { data: emailsPage } = useEmailManualReview()
  const emails = asListItems(emailsPage)
  const pendingCount = emails.length

  return (
    <div className="flex items-center gap-2">
      <EmailPollButton />
      <Button
        type="button"
        variant="secondary"
        size="md"
        className="relative rounded-full px-4"
        onClick={() => navigate("/email-review")}
      >
        Mail Review
        {pendingCount > 0 && (
          <Badge
            variant="destructive"
            shape="pill"
            className="ml-1.5 min-w-[1.25rem] px-1.5 py-0 text-[10px] tabular-nums"
          >
            {pendingCount}
          </Badge>
        )}
      </Button>
      <QuickUploadMenu />
    </div>
  )
}

export default AssociateHeaderActions
