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

  const isLoading = isUsersLoading || isCasesLoading || isBrokenLoading || isEscalatedLoading || isDisputesLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Manager Operations Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor direct reports performance, review credit collections dispatches, and intervene in escalations.
          </p>
        </div>
        <button
          onClick={() => refetchCases()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Center
        </button>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-xs transition-shadow border-l-4 border-l-blue-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Open Cases</span>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-12" /> : openCasesCount}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <FolderOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow border-l-4 border-l-red-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Escalated Cases</span>
              <p className="text-2xl font-bold text-red-655 font-mono">
                {isLoading ? <Skeleton className="h-7 w-12" /> : escalatedCasesCount}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Broken Promises</span>
              <p className="text-2xl font-bold text-amber-500">
                {isLoading ? <Skeleton className="h-7 w-12" /> : brokenPromisesCount}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <HeartOff className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team Collections</span>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-12" /> : teamCasesCount}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes KPI Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-xs transition-shadow border-l-4 border-l-blue-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Open Disputes</span>
              <p className="text-2xl font-bold text-foreground">
                {isDisputesLoading ? <Skeleton className="h-7 w-12" /> : disputes.filter((d) => d.status === "OPEN").length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow border-l-4 border-l-red-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Escalated Disputes</span>
              <p className="text-2xl font-bold text-red-500 font-mono">
                {isDisputesLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  disputes.filter((d) => d.sla?.status === "BREACHED" && d.status !== "RESOLVED" && d.status !== "CLOSED").length
                )}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow border-l-4 border-l-rose-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SLA Breached</span>
              <p className="text-2xl font-bold text-rose-500 font-mono">
                {isDisputesLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  disputes.filter((d) => d.sla?.status === "BREACHED" && d.status !== "RESOLVED" && d.status !== "CLOSED").length
                )}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Resolution</span>
              <p className="text-2xl font-bold text-foreground">
                2.4 Days
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Review Queue</span>
              <p className="text-2xl font-bold text-foreground">
                {isDisputesReviewLoading ? <Skeleton className="h-7 w-12" /> : reviewQueue.length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <HelpCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/20">
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
                        <Mail className="h-4 w-4 text-slate-400" /> Email
                      </span>
                      <span className="font-semibold text-foreground font-mono text-xs">{manager.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-slate-400" /> Access Role
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
                <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-lg">
                  No escalated collection cases pending.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentEscalations.map((esc) => (
                    <div
                      key={esc.id}
                      onClick={() => navigate(`/collections/${esc.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/40 cursor-pointer border border-border transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {esc.customer?.customer_name}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          Amount: ₹{(esc.invoice?.outstanding_amount ?? esc.outstanding_amount_snapshot).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-[9px] py-0 px-1.5 uppercase font-bold flex-shrink-0">
                        Escalated
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disputes by Category Chart */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-3">
              <CardTitle className="text-sm">Disputes by Category</CardTitle>
              <CardDescription>Volume segmented by classification.</CardDescription>
            </CardHeader>
            <CardContent>
              {isDisputesLoading ? (
                <Skeleton className="h-44 w-full" />
              ) : disputesCategoryChartData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                  No active disputes.
                </div>
              ) : (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={disputesCategoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={9} fontWeight={600} />
                      <YAxis fontSize={9} fontWeight={600} />
                      <Tooltip formatter={(v: any) => [v, "Disputes"]} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
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
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg text-xs">
                  No active associates are assigned to report to your profile.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider bg-slate-50/50 dark:bg-zinc-900/10">
                        <th className="py-2.5 px-2">Associate Name</th>
                        <th className="py-2.5 px-2 text-center">Cases</th>
                        <th className="py-2.5 px-2 text-center">Active</th>
                        <th className="py-2.5 px-2 text-center">Escalated</th>
                        <th className="py-2.5 px-2 text-right">Collected</th>
                        <th className="py-2.5 px-2 text-right">Effectiveness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {associatePerformance.map((perf) => (
                        <tr key={perf.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                          <td className="py-3 px-2 font-semibold text-foreground">{perf.name}</td>
                          <td className="py-3 px-2 text-center font-mono">{perf.totalCases}</td>
                          <td className="py-3 px-2 text-center font-mono">{perf.activeCases}</td>
                          <td className="py-3 px-2 text-center font-mono text-rose-500 font-semibold">
                            {perf.escalatedCases}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-semibold text-foreground">
                            ₹{perf.collectedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-3 px-2 text-right font-semibold">
                            <span
                              className={`inline-flex items-center gap-0.5 ${
                                perf.effectiveness >= 0.7
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : perf.effectiveness >= 0.4
                                  ? "text-amber-600 dark:text-amber-500"
                                  : "text-rose-600 dark:text-rose-400"
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
                        <th className="pb-2 px-2">Associate Name</th>
                        <th className="pb-2 px-2">Email</th>
                        <th className="pb-2 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {teamAssociates.map((assoc) => (
                        <tr key={assoc.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 text-xs">
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
