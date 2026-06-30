import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { RootState } from "@/app/store"
import { invoiceService } from "@/features/invoices/services/invoiceService"
import { useAgingAnalytics } from "@/features/collections/hooks/useCollections"
import { useDisputes } from "@/features/disputes/hooks/useDisputes"
import { useCustomers } from "@/features/customers/hooks/useCustomers"
import { usePaymentReviews } from "@/features/matching/hooks/useReviews"
import { Skeleton } from "@/components/ui/skeleton"
import { ClickableWidget } from "../components/ClickableWidget"
import { DashboardGreeting, getGreetingName } from "../components/DashboardGreeting"
import { DisputeCategoryChart } from "../components/DisputeCategoryChart"
import { AgingBucketChart } from "../components/AgingBucketChart"
import { ArrowRight, Users, HelpCircle, DollarSign } from "lucide-react"
import { WidgetNavLink } from "../components/WidgetNavLink"

export const AssociateDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getInvoices(),
  })

  const { data: aging, isLoading: isAgingLoading } = useAgingAnalytics()
  const { data: disputes = [], isLoading: isDisputesLoading } = useDisputes()
  const { data: customers = [], isLoading: isCustomersLoading } = useCustomers()
  const { data: reviews = [], isLoading: isReviewsLoading } = usePaymentReviews()

  const outstandingAmount = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0),
    [invoices]
  )

  const pendingReviews = useMemo(
    () => reviews.filter((r) => r.status === "PENDING"),
    [reviews]
  )

  const topCustomers = useMemo(() => {
    const outstandingByCustomer = new Map<string, number>()
    invoices.forEach((inv) => {
      if (inv.outstanding_amount <= 0) return
      const current = outstandingByCustomer.get(inv.customer_id) ?? 0
      outstandingByCustomer.set(inv.customer_id, current + inv.outstanding_amount)
    })

    return customers
      .map((cust) => ({
        id: cust.id,
        name: cust.customer_name,
        outstanding: outstandingByCustomer.get(cust.id) ?? 0,
      }))
      .filter((c) => c.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 3)
  }, [customers, invoices])

  const displayName = getGreetingName(user?.first_name, user?.email)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <DashboardGreeting displayName={displayName} />

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-3">
        {/* Row 1: Outstanding | Disputes pie | Customers */}
        <div className="grid min-h-0 grid-cols-3 gap-3">
          <ClickableWidget
            to="/invoices"
            title="View all invoices"
            compact
            className="flex flex-col justify-center"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total outstanding</p>
              <DollarSign className="h-5 w-5 text-[#2563EB]" aria-hidden />
            </div>
            {isInvoicesLoading ? (
              <Skeleton className="mt-2 h-12 w-48" />
            ) : (
              <p className="mt-2 text-4xl font-bold tracking-tight text-foreground tabular-nums md:text-5xl">
                ₹{outstandingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </p>
          </ClickableWidget>

          <DisputeCategoryChart
            disputes={disputes}
            loading={isDisputesLoading}
            className="h-full shadow-card"
            height="h-full"
            compact
            showFooter
          />

          <ClickableWidget
            to="/customers"
            title="View all customers"
            compact
            className="flex h-full min-h-0 flex-col"
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customers</p>
                  {isCustomersLoading ? (
                    <Skeleton className="mt-2 h-10 w-14" />
                  ) : (
                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
                      {customers.length}
                    </p>
                  )}
                </div>
                <Users className="h-5 w-5 text-[#9333EA]" aria-hidden />
              </div>
              {isCustomersLoading ? (
                <div className="mt-3 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : topCustomers.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">No outstanding balances.</p>
              ) : (
                <ul className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-hidden">
                  {topCustomers.map((cust) => (
                    <li key={cust.id} className="flex items-center justify-between text-xs">
                      <span className="truncate font-medium text-foreground">{cust.name}</span>
                      <span className="ml-2 shrink-0 tabular-nums text-muted-foreground">
                        ₹{cust.outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="shrink-0 px-1 pb-1 pt-2">
              <WidgetNavLink to="/customers">View all customers</WidgetNavLink>
            </div>
          </ClickableWidget>
        </div>

        {/* Row 2: Aging chart | Payment reviews */}
        <div className="grid min-h-0 grid-cols-2 gap-3">
          <AgingBucketChart
            aging={aging}
            loading={isAgingLoading}
            className="h-full shadow-card"
            height="h-full"
            compact
            showFooter
          />

          <ClickableWidget
            to="/payment-reviews"
            title="View payment matching reviews"
            compact
            className="flex h-full min-h-0 flex-col justify-between"
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment matching reviews</p>
                  {isReviewsLoading ? (
                    <Skeleton className="mt-2 h-10 w-14" />
                  ) : (
                    <p className="mt-2 text-4xl font-bold tracking-tight text-foreground tabular-nums">
                      {pendingReviews.length}
                    </p>
                  )}
                </div>
                <HelpCircle className="h-5 w-5 text-[#16A34A]" aria-hidden />
              </div>
            </div>
            <div className="shrink-0 space-y-2 px-1 pb-1 pt-2">
              <WidgetNavLink to="/payment-reviews">View all payment reviews</WidgetNavLink>
              <Link
                to="/payment-upload-history"
                className="group inline-flex items-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary/75"
              >
                Payment history
                <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </ClickableWidget>
        </div>
      </div>
    </div>
  )
}

export default AssociateDashboard
