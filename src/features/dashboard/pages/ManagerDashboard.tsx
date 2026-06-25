import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { Link, useNavigate } from "react-router-dom"
import { userService } from "@/features/users/services/userService"
import {
  useCollections,
  useBrokenPromises,
  useEscalatedCases,
} from "@/features/collections/hooks/useCollections"
import { useDisputes, useReviewQueue } from "@/features/disputes/hooks/useDisputes"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { UserResponse } from "@/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { ChartCard } from "@/components/ui/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { CHART_COLORS } from "@/lib/design-tokens"
import {
  Mail,
  ShieldCheck,
  Users,
  AlertTriangle,
  FolderOpen,
  HeartOff,
  ArrowRight,
  Percent,
  RefreshCw,
  Clock,
  HelpCircle,
} from "lucide-react"

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: manager } = useSelector((state: RootState) => state.auth);

  // 1. Fetch direct reports (associates)
  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<UserResponse[]>({
    queryKey: ["users"],
    queryFn: userService.listUsers,
    enabled: !!manager,
  });

  const teamAssociates = useMemo(() => {
    return allUsers.filter(
      (u) => u.manager_id === manager?.sub && u.role.role_name === "FINANCE_ASSOCIATE"
    );
  }, [allUsers, manager]);

  const teamAssociateIds = useMemo(() => {
    return teamAssociates.map((a) => a.id);
  }, [teamAssociates]);

  const { data: allCases = [], isLoading: isCasesLoading, refetch: refetchCases } = useCollections();
  const { data: brokenPromises = [], isLoading: isBrokenLoading } = useBrokenPromises();
  const { data: escalatedCases = [], isLoading: isEscalatedLoading } = useEscalatedCases();

  // 3. Dispute queries
  const { data: disputes = [], isLoading: isDisputesLoading } = useDisputes();
  const { data: reviewQueue = [], isLoading: isDisputesReviewLoading } = useReviewQueue("PENDING");

  // Filter collections assigned to the manager's direct team
  const teamCases = useMemo(() => {
    return allCases.filter((c) => c.assigned_to && teamAssociateIds.includes(c.assigned_to));
  }, [allCases, teamAssociateIds]);

  // Calculate manager operational KPIs
  const openCasesCount = allCases.filter((c) => c.status !== "CLOSED").length;
  const escalatedCasesCount = escalatedCases.length;
  const brokenPromisesCount = brokenPromises.length;
  const teamCasesCount = teamCases.length;

  // Recent Escalations Registry
  const recentEscalations = useMemo(() => {
    return escalatedCases
      .sort((a, b) => {
        const dateA = a.escalated_at ? new Date(a.escalated_at).getTime() : 0;
        const dateB = b.escalated_at ? new Date(b.escalated_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [escalatedCases]);

  // Computed Associate Performance Summary Table
  const associatePerformance = useMemo(() => {
    if (!teamAssociates.length) return [];

    return teamAssociates.map((assoc) => {
      const assocCases = allCases.filter((c) => c.assigned_to === assoc.id);
      const activeCases = assocCases.filter((c) => c.status !== "CLOSED");
      const escalatedCount = assocCases.filter((c) => c.status === "ESCALATED").length;
      
      // Calculate amount collected vs snapshot
      let totalSnapshot = 0;
      let totalOutstanding = 0;
      assocCases.forEach((c) => {
        totalSnapshot += c.outstanding_amount_snapshot;
        totalOutstanding += c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot;
      });
      const collectedAmount = Math.max(0, totalSnapshot - totalOutstanding);
      const effectiveness = totalSnapshot > 0 ? collectedAmount / totalSnapshot : 0;

      return {
        id: assoc.id,
        name: `${assoc.first_name} ${assoc.last_name}`,
        email: assoc.email,
        totalCases: assocCases.length,
        activeCases: activeCases.length,
        escalatedCases: escalatedCount,
        collectedAmount,
        effectiveness,
      };
    });
  }, [teamAssociates, allCases]);

  // Chart category data for disputes
  const disputesCategoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    disputes.forEach((d) => {
      const cat = d.dispute_category || "Unclassified";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [disputes]);

  const slaBreachedCount = disputes.filter(
    (d) => d.sla?.status === "BREACHED" && d.status !== "RESOLVED" && d.status !== "CLOSED"
  ).length

  const isLoading = isUsersLoading || isCasesLoading || isBrokenLoading || isEscalatedLoading || isDisputesLoading;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manager Operations Center"
        description="Monitor direct reports performance, review credit collections dispatches, and intervene in escalations."
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetchCases()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh Center
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <KpiGrid>
        <KpiCard
          label="Open cases"
          value={openCasesCount}
          loading={isLoading}
          icon={<FolderOpen className="h-5 w-5" />}
          iconTone="info"
        />
        <KpiCard
          label="Escalated cases"
          value={escalatedCasesCount}
          loading={isLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="destructive"
        />
        <KpiCard
          label="Broken promises"
          value={brokenPromisesCount}
          loading={isLoading}
          icon={<HeartOff className="h-5 w-5" />}
          iconTone="warning"
        />
        <KpiCard
          label="Team collections"
          value={teamCasesCount}
          loading={isLoading}
          icon={<Users className="h-5 w-5" />}
          iconTone="success"
        />
      </KpiGrid>

      {/* Disputes KPI Grid Section */}
      <KpiGrid columns={5}>
        <KpiCard
          label="Open disputes"
          value={disputes.filter((d) => d.status === "OPEN").length}
          loading={isDisputesLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="info"
        />
        <KpiCard
          label="Escalated disputes"
          value={slaBreachedCount}
          loading={isDisputesLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="destructive"
        />
        <KpiCard
          label="SLA breached"
          value={slaBreachedCount}
          loading={isDisputesLoading}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="destructive"
        />
        <KpiCard
          label="Avg resolution"
          value="2.4 days"
          icon={<Clock className="h-5 w-5" />}
          iconTone="warning"
        />
        <KpiCard
          label="Review queue"
          value={reviewQueue.length}
          loading={isDisputesReviewLoading}
          icon={<HelpCircle className="h-5 w-5" />}
          iconTone="success"
        />
      </KpiGrid>

      {/* Main Grid: Profiles + Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manager Profile card */}
        <div className="space-y-6">
          <Card className="shadow-xs border-border h-fit">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <CardTitle>Manager Profile</CardTitle>
              <CardDescription>Authenticated user details.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {manager ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-success/20 bg-success-muted text-lg font-semibold text-success">
                      M
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">
                        Finance Manager
                      </h3>
                      <span className="text-xs text-muted-foreground block mt-0.5">{manager.email}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" /> Email
                      </span>
                      <span className="font-semibold text-foreground font-mono text-xs">{manager.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Access Role
                      </span>
                      <Badge variant="success" className="uppercase font-bold text-[10px]">
                        FINANCE MANAGER
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <Skeleton className="h-28 w-full" />
              )}
            </CardContent>
          </Card>

          {/* Recent Escalations intervenor widget */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Recent Escalations</CardTitle>
                <CardDescription>Cases requiring approval override.</CardDescription>
              </div>
              <Link to="/collections/escalated" className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline">
                Intervene <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : recentEscalations.length === 0 ? (
                <EmptyState
                  icon={<AlertTriangle className="h-6 w-6" />}
                  title="No escalated cases"
                  description="Collection cases requiring manager intervention will appear here."
                />
              ) : (
                <Timeline>
                  {recentEscalations.map((esc) => (
                    <TimelineItem
                      key={esc.id}
                      tone="destructive"
                      icon={<AlertTriangle className="h-2.5 w-2.5" />}
                      title={
                        <button
                          type="button"
                          onClick={() => navigate(`/collections/${esc.id}`)}
                          className="text-left hover:text-primary hover:underline"
                        >
                          {esc.customer?.customer_name}
                        </button>
                      }
                      timestamp={
                        esc.escalated_at
                          ? new Date(esc.escalated_at).toLocaleDateString()
                          : undefined
                      }
                      description={`Outstanding: ₹${(esc.invoice?.outstanding_amount ?? esc.outstanding_amount_snapshot).toLocaleString()}`}
                    />
                  ))}
                </Timeline>
              )}
            </CardContent>
          </Card>

          <ChartCard
            title="Disputes by category"
            description="Volume segmented by classification."
            loading={isDisputesLoading}
            empty={disputesCategoryChartData.length === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disputesCategoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={9} fontWeight={600} />
                <YAxis fontSize={9} fontWeight={600} />
                <Tooltip formatter={(v: number | string) => [v, "Disputes"]} />
                <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Right Side: Performance summaries (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Direct report associate performance metrics summary */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <CardTitle>Associate Performance Summary</CardTitle>
              <CardDescription>
                Overview of case distribution and payment collection effectiveness per associate.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : associatePerformance.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No direct reports yet"
                  description="Associates assigned to your profile will appear in this performance summary."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        <th scope="col" className="py-2.5 px-2">Associate Name</th>
                        <th scope="col" className="py-2.5 px-2 text-center">Cases</th>
                        <th scope="col" className="py-2.5 px-2 text-center">Active</th>
                        <th scope="col" className="py-2.5 px-2 text-center">Escalated</th>
                        <th scope="col" className="py-2.5 px-2 text-right">Collected</th>
                        <th scope="col" className="py-2.5 px-2 text-right">Effectiveness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {associatePerformance.map((perf) => (
                        <tr key={perf.id} className="transition-colors hover:bg-muted/40">
                          <td className="py-3 px-2 font-semibold text-foreground">{perf.name}</td>
                          <td className="py-3 px-2 text-center font-mono">{perf.totalCases}</td>
                          <td className="py-3 px-2 text-center font-mono">{perf.activeCases}</td>
                          <td className="py-3 px-2 text-center font-mono font-semibold text-destructive">
                            {perf.escalatedCases}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-semibold text-foreground">
                            ₹{perf.collectedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-3 px-2 text-right font-semibold">
                            <span
                              className={`inline-flex items-center gap-0.5 ${
                                perf.effectiveness >= 0.7
                                  ? "text-success"
                                  : perf.effectiveness >= 0.4
                                  ? "text-warning"
                                  : "text-destructive"
                              }`}
                            >
                              <Percent className="h-3 w-3" /> {(perf.effectiveness * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Direct reports active/inactive roster */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <CardTitle>My Direct Reports Roster</CardTitle>
              <CardDescription>Associate account statuses.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isUsersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : teamAssociates.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg text-xs">
                  No direct report associates.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                        <th scope="col" className="pb-2 px-2">Associate Name</th>
                        <th scope="col" className="pb-2 px-2">Email</th>
                        <th scope="col" className="pb-2 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {teamAssociates.map((assoc) => (
                        <tr key={assoc.id} className="text-xs transition-colors hover:bg-muted/40">
                          <td className="py-2.5 px-2 font-semibold text-foreground">
                            {assoc.first_name} {assoc.last_name}
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground font-mono text-xs truncate max-w-[180px]">
                            {assoc.email}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <Badge variant={assoc.is_active ? "success" : "destructive"} className="text-[9px] py-0 px-1.5 font-bold">
                              {assoc.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
