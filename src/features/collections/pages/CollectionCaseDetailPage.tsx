import React, { useState, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RootState } from "@/app/store"
import { useToast } from "@/components/ui/toast"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  useCollectionCase,
  useCreateActivity,
  useCreatePromise,
  useReassignCase,
  useCloseCase,
  useOverrideStatus,
} from "../hooks/useCollections"
import { userService } from "@/features/users/services/userService"
import { useQuery } from "@tanstack/react-query"
import {
  createActivitySchema,
  CreateActivityInput,
  createPromiseSchema,
  CreatePromiseInput,
} from "../schemas"
import {
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  HeartOff,
  ShieldAlert,
  DollarSign,
  CheckCircle2,
  UserPlus,
  RefreshCw,
  AlertCircle,
  User,
  ArrowLeft,
  Activity,
  ChevronRight,
  TrendingUp,
} from "lucide-react"
import {
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
} from "./OpenCasesPage"

export const CollectionCaseDetailPage: React.FC = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const isManager = currentUser?.role === "FINANCE_MANAGER" || currentUser?.role === "ADMIN";

  // Fetch Case Data
  const { data: c, isLoading, isError, refetch } = useCollectionCase(id);

  // User List Query (to allow reassigning)
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
    enabled: isManager,
  });

  const associates = useMemo(() => {
    return allUsers.filter((u) => u.role.role_name === "FINANCE_ASSOCIATE" && u.is_active);
  }, [allUsers]);

  // Mutations
  const createActivityMutation = useCreateActivity();
  const createPromiseMutation = useCreatePromise();
  const reassignMutation = useReassignCase();
  const closeMutation = useCloseCase();
  const overrideMutation = useOverrideStatus();

  // Modals state
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isPromiseOpen, setIsPromiseOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  // Reassign state
  const [targetAssociateId, setTargetAssociateId] = useState("");
  const [targetStatus, setTargetStatus] = useState("");

  // Zod Forms setup
  const {
    register: registerActivity,
    handleSubmit: handleSubmitActivity,
    reset: resetActivity,
    formState: { errors: activityErrors },
  } = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      activity_type: "CALL_MADE",
      notes: "",
    },
  });

  const {
    register: registerPromise,
    handleSubmit: handleSubmitPromise,
    reset: resetPromise,
    formState: { errors: promiseErrors },
  } = useForm<CreatePromiseInput>({
    resolver: zodResolver(createPromiseSchema) as any,
    defaultValues: {
      promised_date: "",
    },
  });

  // Handlers
  const handleActivitySubmit = (data: CreateActivityInput) => {
    createActivityMutation.mutate(
      { caseId: id, activityType: data.activity_type, notes: data.notes },
      {
        onSuccess: () => {
          setIsActivityOpen(false);
          resetActivity();
          toast({
            title: "Activity Logged",
            description: "Activity recorded successfully on case timeline.",
            type: "success",
          });
        },
        onError: (err: any) => {
          toast({
            title: "Error Logging Activity",
            description: err.response?.data?.detail || "An error occurred.",
            type: "error",
          });
        },
      }
    );
  };

  const handlePromiseSubmit = (data: any) => {
    createPromiseMutation.mutate(
      { caseId: id, promisedDate: data.promised_date },
      {
        onSuccess: () => {
          setIsPromiseOpen(false);
          resetPromise();
          toast({
            title: "Promise Registered",
            description: "Payment commitment recorded on case timeline.",
            type: "success",
          });
        },
        onError: (err: any) => {
          toast({
            title: "Error Registering Promise",
            description: err.response?.data?.detail || "An error occurred.",
            type: "error",
          });
        },
      }
    );
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssociateId) return;

    reassignMutation.mutate(
      { caseId: id, associateId: targetAssociateId },
      {
        onSuccess: () => {
          setIsReassignOpen(false);
          toast({
            title: "Case Reassigned",
            description: "Case reassigned to associate successfully.",
            type: "success",
          });
        },
        onError: (err: any) => {
          toast({
            title: "Reassignment Failed",
            description: err.response?.data?.detail || "An error occurred.",
            type: "error",
          });
        },
      }
    );
  };

  const handleCloseSubmit = () => {
    closeMutation.mutate(id, {
      onSuccess: () => {
        setIsCloseOpen(false);
        toast({
          title: "Case Closed",
          description: "This case has been closed successfully.",
          type: "success",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Close Failed",
          description: err.response?.data?.detail || "An error occurred.",
          type: "error",
        });
      },
    });
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    overrideMutation.mutate(
      { caseId: id, newStatus: targetStatus },
      {
        onSuccess: () => {
          setIsOverrideOpen(false);
          toast({
            title: "Status Overridden",
            description: "Workflow status overridden successfully.",
            type: "success",
          });
        },
        onError: (err: any) => {
          toast({
            title: "Override Failed",
            description: err.response?.data?.detail || "An error occurred.",
            type: "error",
          });
        },
      }
    );
  };

  // Helper to map activity type to icon and color
  const getActivityTypeConfig = (type: string) => {
    switch (type) {
      case "EMAIL_SENT":
        return { icon: Mail, bg: "bg-blue-500/10 text-blue-500" };
      case "CALL_MADE":
        return { icon: Phone, bg: "bg-emerald-500/10 text-emerald-500" };
      case "FOLLOW_UP":
        return { icon: MessageSquare, bg: "bg-purple-500/10 text-purple-500" };
      case "PROMISE_CREATED":
        return { icon: Calendar, bg: "bg-indigo-500/10 text-indigo-500" };
      case "PROMISE_BROKEN":
        return { icon: HeartOff, bg: "bg-rose-500/10 text-rose-500" };
      case "ESCALATED":
        return { icon: ShieldAlert, bg: "bg-red-500/10 text-red-500" };
      case "PAYMENT_RECEIVED":
        return { icon: DollarSign, bg: "bg-green-500/10 text-green-500" };
      case "CASE_CLOSED":
        return { icon: CheckCircle2, bg: "bg-slate-550/10 text-slate-500" };
      case "CASE_ASSIGNED":
        return { icon: UserPlus, bg: "bg-orange-500/10 text-orange-500" };
      case "AGING_BUCKET_CHANGED":
        return { icon: RefreshCw, bg: "bg-cyan-500/10 text-cyan-500" };
      default:
        return { icon: Activity, bg: "bg-slate-500/10 text-slate-500" };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (isError || !c) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 p-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-base font-bold text-foreground mb-2">Failed to Load Case Workspace</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
          Verify case ID is valid and that you have sufficient privileges to view this collection entity.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/collections/open"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-bold bg-background text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Cases
          </Link>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95"
          >
            Retry Loading
          </button>
        </div>
      </Card>
    );
  }

  const outstanding = c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot;

  return (
    <div className="space-y-6">
      {/* Detail Header breadcrumb & info */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-muted-foreground">
          <Link to="/collections" className="hover:underline">
            Collections
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Case Workspace</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Case details: {c.customer?.customer_name || "Active Client"}
            </h1>
            <div className="flex gap-2">
              <Badge variant={getStatusBadgeVariant(c.status)} className="text-[10px] py-0.5 px-2.5 uppercase font-bold tracking-wider">
                {c.status.replace("_", " ")}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(c.priority)} className="text-[10px] py-0.5 px-2.5 uppercase font-bold tracking-wider">
                {c.priority}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                resetActivity();
                setIsActivityOpen(true);
              }}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              Log Activity
            </button>
            <button
              onClick={() => {
                resetPromise();
                setIsPromiseOpen(true);
              }}
              className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors shadow-xs"
            >
              Create Promise
            </button>

            {isManager && (
              <>
                <button
                  onClick={() => {
                    setTargetAssociateId(c.assigned_to || "");
                    setIsReassignOpen(true);
                  }}
                  className="rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
                >
                  Reassign Case
                </button>
                <button
                  onClick={() => {
                    setTargetStatus(c.status);
                    setIsOverrideOpen(true);
                  }}
                  className="rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50/50 transition-colors shadow-xs"
                >
                  Override Status
                </button>
                <button
                  onClick={() => setIsCloseOpen(true)}
                  className="rounded-lg border border-transparent bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors shadow-xs"
                >
                  Close Case
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Case Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Outstanding Balance
              </span>
              <p className="text-xl font-bold text-foreground font-mono">
                ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Aging Bucket Category
              </span>
              <p className="text-xl font-bold text-foreground">
                {c.aging_bucket}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <RefreshCw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Owner Associate
              </span>
              <p className="text-sm font-semibold text-foreground truncate mt-1">
                {c.assigned_associate_name}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500">
              <User className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Opened Date
              </span>
              <p className="text-sm font-semibold text-foreground mt-1">
                {new Date(c.opened_at).toLocaleDateString()}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Details Sections Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer + Invoice details (1 Col) */}
        <div className="space-y-6">
          {/* Customer Metadata Card */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm">Customer Demographics</CardTitle>
              <CardDescription>Accounts receivable client records.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client Name:</span>
                <span className="font-semibold text-foreground">{c.customer?.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer Code:</span>
                <span className="font-semibold text-foreground font-mono">{c.customer?.customer_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Address:</span>
                <span className="font-semibold text-foreground font-mono">{c.customer?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone Number:</span>
                <span className="font-semibold text-foreground">{c.customer?.phone || "N/A"}</span>
              </div>
              <div className="flex flex-col space-y-1 pt-1.5 border-t border-border">
                <span className="text-muted-foreground">Billing Address:</span>
                <span className="font-semibold text-foreground leading-relaxed">
                  {c.customer?.billing_address || "No address listed"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Metadata Card */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm">Invoice Profile</CardTitle>
              <CardDescription>Associated invoice document info.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number:</span>
                <span className="font-semibold text-primary hover:underline">
                  <Link to={`/invoices/${c.invoice_id}`}>{c.invoice?.invoice_number || "INV-N/A"}</Link>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Date:</span>
                <span className="font-semibold text-foreground">
                  {c.invoice?.invoice_date ? new Date(c.invoice.invoice_date).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-semibold text-foreground">
                  {c.invoice?.due_date ? new Date(c.invoice.due_date).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Invoiced:</span>
                <span className="font-semibold text-foreground font-mono">
                  ₹{c.invoice?.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding Amount:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                  ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Status:</span>
                <Badge variant={c.invoice?.status === "PAID" ? "success" : "default"} className="text-[9px] py-0 px-1.5 uppercase font-bold">
                  {c.invoice?.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Tabs & Interactive Lists (2 Cols) */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activities" className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
              <TabsTrigger value="activities" className="text-xs font-semibold">
                Activities
              </TabsTrigger>
              <TabsTrigger value="promises" className="text-xs font-semibold">
                Promises
              </TabsTrigger>
              <TabsTrigger value="reminders" className="text-xs font-semibold">
                Reminders
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-xs font-semibold">
                Audit Timeline
              </TabsTrigger>
            </TabsList>

            {/* ACTIVITIES TIMELINE TAB */}
            <TabsContent value="activities" className="mt-4">
              <Card className="shadow-xs border-border">
                <CardHeader className="pb-3 border-b border-border mb-4 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-sm">Activity Logs</CardTitle>
                    <CardDescription>Interactive chronological dunning and communication logs.</CardDescription>
                  </div>
                  <button
                    onClick={() => {
                      resetActivity();
                      setIsActivityOpen(true);
                    }}
                    className="rounded bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-white transition-colors"
                  >
                    Add Log Entry
                  </button>
                </CardHeader>
                <CardContent className="pt-2">
                  {!c.activities || c.activities.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-xs">
                      No activities recorded. Add manual follow-up or email log to track progress.
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l border-border space-y-6">
                      {c.activities.map((act: any) => {
                        const config = getActivityTypeConfig(act.activity_type);
                        return (
                          <div key={act.id} className="relative">
                            {/* Dot indicator */}
                            <span className={`absolute -left-[35px] top-0.5 rounded-full p-1.5 flex items-center justify-center border border-border bg-white dark:bg-zinc-900 ${config.bg}`}>
                              <config.icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  {act.activity_type.replace(/_/g, " ")}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(act.created_at).toLocaleString()}
                                </span>
                              </div>
                              {act.notes && (
                                <p className="text-xs text-muted-foreground leading-relaxed bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-lg border border-border mt-1">
                                  {act.notes}
                                </p>
                              )}
                              <p className="text-[10px] font-semibold text-muted-foreground">
                                Performed By: {act.performed_by ? "Case Associate" : "System automated"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PROMISES TO PAY TAB */}
            <TabsContent value="promises" className="mt-4">
              <Card className="shadow-xs border-border">
                <CardHeader className="pb-3 border-b border-border mb-4 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-sm">Payment Commitments</CardTitle>
                    <CardDescription>Promised amount settlements registered on case.</CardDescription>
                  </div>
                  <button
                    onClick={() => {
                      resetPromise();
                      setIsPromiseOpen(true);
                    }}
                    className="rounded bg-primary hover:bg-primary/90 px-2.5 py-1.5 text-xs font-bold text-primary-foreground transition-colors"
                  >
                    Add Promise
                  </button>
                </CardHeader>
                <CardContent className="pt-2">
                  {!c.promises || c.promises.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-xs">
                      No payment promises listed on this case. Setup commitment rules to track settling schedules.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {c.promises.map((p: any) => {
                        let statusColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
                        if (p.status === "FULFILLED") {
                          statusColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                        } else if (p.status === "BROKEN") {
                          statusColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
                        }
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-3.5 border border-border rounded-lg bg-card shadow-xs"
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-mono font-bold text-foreground">
                                ₹{p.promised_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                              <div className="flex items-center space-x-2 text-[10px] text-muted-foreground">
                                <span>Target Date: {new Date(p.promised_date).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Created: {new Date(p.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold border ${statusColor}`}>
                              {p.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* REMINDERS TAB */}
            <TabsContent value="reminders" className="mt-4">
              <Card className="shadow-xs border-border">
                <CardHeader className="pb-3 border-b border-border mb-4">
                  <CardTitle className="text-sm">Case Reminder History</CardTitle>
                  <CardDescription>Generated emails and payment links sent for this case.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {!c.reminders || c.reminders.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-xs">
                      No automated dunning alerts generated for this case.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground uppercase text-[9px] font-bold">
                            <th className="pb-2">Reminder #</th>
                            <th className="pb-2">Subject</th>
                            <th className="pb-2">Sent To</th>
                            <th className="pb-2 text-center">Status</th>
                            <th className="pb-2 text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {c.reminders.map((rem: any) => (
                            <tr key={rem.id}>
                              <td className="py-2.5 font-mono">#{rem.reminder_number}</td>
                              <td className="py-2.5 font-semibold text-foreground truncate max-w-[150px]">{rem.subject}</td>
                              <td className="py-2.5 text-muted-foreground font-mono text-[10px] truncate max-w-[120px]">{rem.sent_to}</td>
                              <td className="py-2.5 text-center">
                                <Badge variant={rem.status === "SENT" ? "success" : "default"} className="text-[9px] py-0 px-1.5 uppercase font-bold">
                                  {rem.status}
                                </Badge>
                              </td>
                              <td className="py-2.5 text-right text-muted-foreground">
                                {new Date(rem.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AUDIT TIMELINE TAB */}
            <TabsContent value="audit" className="mt-4">
              <Card className="shadow-xs border-border">
                <CardHeader className="pb-3 border-b border-border mb-4">
                  <CardTitle className="text-sm">Audit Trails</CardTitle>
                  <CardDescription>Case workflow transitions and lifecycle records.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="relative pl-6 border-l border-border space-y-5 text-xs text-muted-foreground">
                    <div className="relative">
                      <span className="absolute -left-[30px] top-0.5 rounded-full p-1 bg-primary text-primary-foreground">
                        <TrendingUp className="h-3 w-3" />
                      </span>
                      <p className="font-semibold text-foreground">Case last updated</p>
                      <p className="text-[10px] mt-0.5">{new Date(c.updated_at).toLocaleString()}</p>
                    </div>

                    {c.escalated_at && (
                      <div className="relative">
                        <span className="absolute -left-[30px] top-0.5 rounded-full p-1 bg-rose-500 text-white">
                          <ShieldAlert className="h-3 w-3" />
                        </span>
                        <p className="font-semibold text-foreground">Intervention Escalated to Manager</p>
                        <p className="text-[10px] mt-0.5">{new Date(c.escalated_at).toLocaleString()}</p>
                        {c.escalated_manager_name && (
                          <p className="text-[10px] font-semibold">Assigned Manager: {c.escalated_manager_name}</p>
                        )}
                      </div>
                    )}

                    <div className="relative">
                      <span className="absolute -left-[30px] top-0.5 rounded-full p-1 bg-slate-500 text-white">
                        <User className="h-3 w-3" />
                      </span>
                      <p className="font-semibold text-foreground">Case assigned ownership</p>
                      <p className="text-[10px] mt-0.5">{new Date(c.created_at).toLocaleString()}</p>
                      <p className="text-[10px] font-semibold">Assignee: {c.assigned_associate_name}</p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[30px] top-0.5 rounded-full p-1 bg-blue-500 text-white">
                        <CheckCircle2 className="h-3 w-3" />
                      </span>
                      <p className="font-semibold text-foreground">Case initialized in collections</p>
                      <p className="text-[10px] mt-0.5">{new Date(c.opened_at).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* DIALOG: LOG MANUAL ACTIVITY */}
      <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Activity Entry</DialogTitle>
            <DialogDescription>
              Record customer communication follow-ups, calls, or dunning emails.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitActivity(handleActivitySubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Activity Type
              </label>
              <select
                {...registerActivity("activity_type")}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
              >
                <option value="CALL_MADE">Phone Call Made</option>
                <option value="EMAIL_SENT">Manual Email Sent</option>
                <option value="FOLLOW_UP">Follow-Up Note</option>
              </select>
              {activityErrors.activity_type && (
                <span className="text-xs text-rose-500 mt-1 block">{activityErrors.activity_type.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Detailed Notes
              </label>
              <textarea
                rows={4}
                {...registerActivity("notes")}
                placeholder="Discussed payment options with customer. Promised a bank draft within 5 business days..."
                className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
              {activityErrors.notes && (
                <span className="text-xs text-rose-500 mt-1 block">{activityErrors.notes.message}</span>
              )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsActivityOpen(false)}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createActivityMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                {createActivityMutation.isPending ? "Logging..." : "Log Activity"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CREATE PAYMENT PROMISE */}
      <Dialog open={isPromiseOpen} onOpenChange={setIsPromiseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Payment Commitment</DialogTitle>
            <DialogDescription>
              Record the target date by which the customer has committed to settle the outstanding balance.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPromise(handlePromiseSubmit)} className="space-y-4">

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Commitment Settlement Date
              </label>
              <input
                type="date"
                {...registerPromise("promised_date")}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-mono"
              />
              {promiseErrors.promised_date && (
                <span className="text-xs text-rose-500 mt-1 block">{promiseErrors.promised_date.message}</span>
              )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsPromiseOpen(false)}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createPromiseMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                {createPromiseMutation.isPending ? "Registering..." : "Record Promise"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: REASSIGN CASE (MANAGERS ONLY) */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Case Owner</DialogTitle>
            <DialogDescription>
              Transfer responsibility for this case to another active Finance Associate.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                New Associate Assignee
              </label>
              <select
                value={targetAssociateId}
                onChange={(e) => setTargetAssociateId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                required
              >
                <option value="">Choose Associate...</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.first_name} {a.last_name} ({a.email})
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsReassignOpen(false)}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reassignMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                {reassignMutation.isPending ? "Reassigning..." : "Confirm Reassignment"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: OVERRIDE STATUS (MANAGERS ONLY) */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Case Status</DialogTitle>
            <DialogDescription>
              Set the case collections status manually. This overrides all system rules.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Select Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                required
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="PROMISED">PROMISED</option>
                <option value="ESCALATED">ESCALATED</option>
                <option value="DISPUTED">DISPUTED</option>
              </select>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsOverrideOpen(false)}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={overrideMutation.isPending}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {overrideMutation.isPending ? "Updating..." : "Override Status"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CLOSE CONFIRMATION (MANAGERS ONLY) */}
      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="h-5 w-5" /> Close Collection Case
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to close this case manually? Closing indicates resolving all outstanding billing disputes or payment settlements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setIsCloseOpen(false)}
              className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
            >
              Cancel
            </button>
            <button
              onClick={handleCloseSubmit}
              disabled={closeMutation.isPending}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {closeMutation.isPending ? "Closing..." : "Yes, Close Case"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionCaseDetailPage;
