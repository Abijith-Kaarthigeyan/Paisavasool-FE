import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { userService } from "@/features/users/services/userService"
import { paymentService } from "@/features/payments/services/paymentService"
import { reviewService } from "@/features/matching/services/reviewService"
import { UserResponse } from "@/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Mail, 
  ShieldCheck, 
  Users, 
  FileSpreadsheet, 
  AlertCircle 
} from "lucide-react"

export const ManagerDashboard: React.FC = () => {
  const { user: manager } = useSelector((state: RootState) => state.auth);

  // 1. Fetch all users to find reporting associates
  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<UserResponse[]>({
    queryKey: ["users"],
    queryFn: userService.listUsers,
    enabled: !!manager,
  });

  // Filter associates reporting to this manager
  const teamAssociates = allUsers.filter(
    (u) => u.manager_id === manager?.sub && u.role.role_name === "FINANCE_ASSOCIATE"
  );
  const teamAssociateIds = teamAssociates.map(a => a.id);

  // 2. Fetch payment uploads to calculate team payment metrics
  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["paymentUploads"],
    queryFn: () => paymentService.listPaymentUploads(),
    enabled: !!manager && teamAssociateIds.length > 0,
  });

  // Filter payments uploaded by team members
  const teamPayments = payments.filter(p => teamAssociateIds.includes(p.uploaded_by));
  const teamPaymentCount = teamPayments.length;

  // 3. Fetch reviews queue to find pending reviews related to team payments
  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery({
    queryKey: ["paymentReviews"],
    queryFn: () => reviewService.listPaymentReviews(),
    enabled: !!manager && teamAssociateIds.length > 0,
  });

  // Global pending reviews as fallback if team assignment is null
  const globalPendingReviews = reviews.filter(r => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
          Manager Operations Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor your team of associates, review operational efficiency, and view billing summaries.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manager Information Profile Card */}
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

        {/* Team Overview & KPI Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="hover:shadow-xs transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">My Team Size</span>
                  <p className="text-2xl font-bold text-foreground">
                    {isUsersLoading ? <Skeleton className="h-7 w-12" /> : `${teamAssociates.length} Associates`}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xs transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team Uploaded Payments</span>
                  <p className="text-2xl font-bold text-foreground">
                    {isPaymentsLoading ? <Skeleton className="h-7 w-12" /> : teamPaymentCount}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xs transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Review Items</span>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {isReviewsLoading ? <Skeleton className="h-7 w-12" /> : globalPendingReviews}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reporting Associates Table */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <CardTitle>My Direct Reports</CardTitle>
              <CardDescription>Finance Associates assigned to report to your profile.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isUsersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : teamAssociates.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                  No direct report associates have been assigned to you. Admin can assign manager profiles.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                        <th className="pb-3 px-3">Associate Name</th>
                        <th className="pb-3 px-3">Email Address</th>
                        <th className="pb-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {teamAssociates.map((assoc) => (
                        <tr key={assoc.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {assoc.first_name} {assoc.last_name}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground font-mono text-xs">{assoc.email}</td>
                          <td className="py-3 px-3">
                            <Badge variant={assoc.is_active ? "success" : "destructive"} className="text-[10px] py-0.5 px-2 font-bold">
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
