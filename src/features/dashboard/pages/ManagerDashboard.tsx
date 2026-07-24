import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { userService } from "@/features/users/services/userService"
import {
  useCollections,
  useEscalatedCases,
} from "@/features/collections/hooks/useCollections"
import { UserResponse } from "@/types"
import { DashboardGreeting, getGreetingName } from "../components/DashboardGreeting"
import { ManagerEscalationsMenu } from "../components/ManagerEscalationsMenu"
import { AssociatePerformanceWidget } from "../components/AssociatePerformanceWidget"
import { MonthlyCollectionsTrendChart } from "../components/MonthlyCollectionsTrendChart"
import { CommunicationsFeed } from "../components/CommunicationsFeed"
import { RecentEscalationsWidget } from "../components/RecentEscalationsWidget"
import { CollectionStatusChart } from "../components/CollectionStatusChart"
import { WidgetNavLink } from "../components/WidgetNavLink"

export const ManagerDashboard: React.FC = () => {
  const { user: manager } = useSelector((state: RootState) => state.auth)

  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<UserResponse[]>({
    queryKey: ["users"],
    queryFn: userService.listUsers,
    enabled: !!manager,
  })

  const teamAssociates = useMemo(() => {
    return allUsers.filter(
      (u) => u.manager_id === manager?.sub && u.role.role_name === "FINANCE_ASSOCIATE"
    )
  }, [allUsers, manager])

  const teamAssociateIds = useMemo(() => teamAssociates.map((a) => a.id), [teamAssociates])

  const { data: allCases = [], isLoading: isCasesLoading } = useCollections({
    limit: 500,
  })
  const { data: escalatedCases = [], isLoading: isEscalatedLoading } =
    useEscalatedCases({ limit: 500 })

  const teamCases = useMemo(() => {
    return allCases.filter((c) => c.assigned_to && teamAssociateIds.includes(c.assigned_to))
  }, [allCases, teamAssociateIds])

  const associatePerformance = useMemo(() => {
    if (!teamAssociates.length) return []

    return teamAssociates
      .map((assoc) => {
        const assocCases = allCases.filter((c) => c.assigned_to === assoc.id)
        const activeCases = assocCases.filter((c) => c.status !== "CLOSED")

        let totalSnapshot = 0
        let totalOutstanding = 0
        assocCases.forEach((c) => {
          totalSnapshot += c.outstanding_amount_snapshot
          totalOutstanding += c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot
        })
        const collectedAmount = Math.max(0, totalSnapshot - totalOutstanding)
        const effectiveness = totalSnapshot > 0 ? collectedAmount / totalSnapshot : 0

        return {
          id: assoc.id,
          name: `${assoc.first_name} ${assoc.last_name}`,
          activeCases: activeCases.length,
          collectedAmount,
          effectiveness,
        }
      })
      .sort((a, b) => b.effectiveness - a.effectiveness)
  }, [teamAssociates, allCases])

  const recentEscalations = useMemo(() => {
    return [...escalatedCases].sort((a, b) => {
      const dateA = a.escalated_at ? new Date(a.escalated_at).getTime() : 0
      const dateB = b.escalated_at ? new Date(b.escalated_at).getTime() : 0
      return dateB - dateA
    })
  }, [escalatedCases])

  const isLoading = isUsersLoading || isCasesLoading || isEscalatedLoading
  const displayName = getGreetingName(manager?.first_name, manager?.email)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <DashboardGreeting
        displayName={displayName}
        action={<ManagerEscalationsMenu />}
      />

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-3">
        {/* Row 1: Associate performance | Monthly collections trend */}
        <div className="grid min-h-0 grid-cols-3 gap-3">
          <AssociatePerformanceWidget rows={associatePerformance} loading={isLoading} />

          <div className="col-span-2 min-h-0">
            <MonthlyCollectionsTrendChart
              cases={teamCases}
              loading={isLoading}
              className="h-full shadow-card"
              height="h-full"
              compact
              showFooter
            />
          </div>
        </div>

        {/* Row 2: Communications | Recent escalations | Collection status */}
        <div className="grid min-h-0 grid-cols-3 gap-3">
          <CommunicationsFeed
            height="h-full"
            maxItems={5}
            className="min-h-0"
            footer={<WidgetNavLink to="/collections">View collections</WidgetNavLink>}
          />

          <RecentEscalationsWidget
            escalations={recentEscalations}
            loading={isLoading}
          />

          <CollectionStatusChart
            cases={teamCases}
            loading={isLoading}
            className="h-full shadow-card"
            height="h-full"
            compact
          />
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard
