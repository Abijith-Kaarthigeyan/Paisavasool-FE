import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { CustomerDetail } from "@/features/customers/types"
import type { Dispute } from "../../types"

interface DisputeContextRailProps {
  dispute: Dispute
  customerDetail?: CustomerDetail | null
  isLoadingCustomer?: boolean
}

export function DisputeCustomerCard({
  dispute,
  customerDetail,
  isLoading,
}: {
  dispute: Dispute
  customerDetail?: CustomerDetail | null
  isLoading?: boolean
}) {
  const customer = customerDetail?.customer ?? dispute.customer

  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Customer</CardTitle>
        <CardDescription>Account holder for this dispute.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              {customer?.id ? (
                <Link
                  to={`/customers/${customer.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {customer.customer_name}
                </Link>
              ) : (
                <span className="font-medium text-foreground">Pending</span>
              )}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Customer code</span>
              <span className="font-mono font-medium text-foreground">
                {customer?.customer_code || "N/A"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="max-w-[240px] truncate text-right font-mono text-xs font-medium text-foreground">
                {customer?.email || "N/A"}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function DisputeContextRail({
  dispute,
  customerDetail,
  isLoadingCustomer,
}: DisputeContextRailProps) {
  return (
    <div className="space-y-6">
      <DisputeCustomerCard
        dispute={dispute}
        customerDetail={customerDetail}
        isLoading={isLoadingCustomer}
      />
    </div>
  )
}
