import React, { useMemo, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { EmptyState } from "@/components/ui/empty-state"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  COLLECTION_STATUS_VARIANT,
  PRIORITY_VARIANT,
  PROMISE_STATUS_VARIANT,
  REMINDER_STATUS_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import {
  getReminderDisplayDate,
  getReminderStatusDescription,
  getReminderStatusLabel,
} from "../utils/reminderFormatters"
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
  Activity,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityType } from "../types"

function getActivityTypeConfig(type: ActivityType) {
  switch (type) {
    case "EMAIL_SENT":
      return { icon: <Mail className="h-2.5 w-2.5" />, tone: "primary" as const }
    case "CALL_MADE":
      return { icon: <Phone className="h-2.5 w-2.5" />, tone: "success" as const }
    case "FOLLOW_UP":
      return { icon: <MessageSquare className="h-2.5 w-2.5" />, tone: "default" as const }
    case "PROMISE_CREATED":
      return { icon: <Calendar className="h-2.5 w-2.5" />, tone: "primary" as const }
    case "PROMISE_BROKEN":
      return { icon: <HeartOff className="h-2.5 w-2.5" />, tone: "destructive" as const }
    case "ESCALATED":
      return { icon: <ShieldAlert className="h-2.5 w-2.5" />, tone: "destructive" as const }
    case "PAYMENT_RECEIVED":
      return { icon: <DollarSign className="h-2.5 w-2.5" />, tone: "success" as const }
    case "CASE_CLOSED":
      return { icon: <CheckCircle2 className="h-2.5 w-2.5" />, tone: "default" as const }
    case "CASE_ASSIGNED":
      return { icon: <UserPlus className="h-2.5 w-2.5" />, tone: "warning" as const }
    case "AGING_BUCKET_CHANGED":
      return { icon: <RefreshCw className="h-2.5 w-2.5" />, tone: "default" as const }
    default:
      return { icon: <Activity className="h-2.5 w-2.5" />, tone: "default" as const }
  }
}

export const CollectionCaseDetailPage: React.FC = () => {
  const { id = "" } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  const isManager = currentUser?.role === "FINANCE_MANAGER" || currentUser?.role === "ADMIN"

  const { data: c, isLoading, isError, refetch } = useCollectionCase(id)

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
    enabled: isManager,
  })

  const associates = useMemo(() => {
    return allUsers.filter((u) => u.role.role_name === "FINANCE_ASSOCIATE" && u.is_active)
  }, [allUsers])

  const createActivityMutation = useCreateActivity()
  const createPromiseMutation = useCreatePromise()
  const reassignMutation = useReassignCase()
  const closeMutation = useCloseCase()
  const overrideMutation = useOverrideStatus()

  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const [isPromiseOpen, setIsPromiseOpen] = useState(false)
  const [isReassignOpen, setIsReassignOpen] = useState(false)
  const [isCloseOpen, setIsCloseOpen] = useState(false)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)
  const [expandedReminders, setExpandedReminders] = useState<Record<string, boolean>>({})

  const [targetAssociateId, setTargetAssociateId] = useState("")
  const [targetStatus, setTargetStatus] = useState("")

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
  })

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
  })

  const handleActivitySubmit = (data: CreateActivityInput) => {
    createActivityMutation.mutate(
      { caseId: id, activityType: data.activity_type, notes: data.notes },
      {
        onSuccess: () => {
          setIsActivityOpen(false)
          resetActivity()
          toast({
            title: "Activity logged",
            description: "Activity recorded successfully on case timeline.",
            type: "success",
          })
        },
        onError: (err: any) => {
          toast({
            title: "Error logging activity",
            description: err.response?.data?.detail || "An error occurred.",
            type: "error",
          })
        },
      }
    )
  }

  const handlePromiseSubmit = (data: any) => {
    createPromiseMutation.mutate(
      { caseId: id, promisedDate: data.promised_date },
      {
        onSuccess: () => {
          setIsPromiseOpen(false)
          resetPromise()
          toast({
            title: "Promise registered",
            description: "Payment commitment recorded on case timeline.",
            type: "success",
          })
        },
        onError: (err: any) => {
          toast({
            title: "Error registering promise",
            description: err.response?.data?.detail || "An error occurred.",
            type: "error",
          })
        },
      }
    )
  }

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetAssociateId) return

    reassignMutation.mutate(
      { caseId: id, associateId: targetAssociateId },
      {
        onSuccess: () => {
          setIsReassignOpen(false)
          toast({
            title: "Case reassigned",
            description: "Case reassigned to associate successfully.",
            type: "success",
          })
        },
        onError: (err: any) => {
          toast({
            title: "Reassignment failed",
            description: err.response?.data?.detail || "An error occurred.",
            type: "error",
          })
        },
      }
    )
  }

  const handleCloseSubmit = () => {
    closeMutation.mutate(id, {
      onSuccess: () => {
        setIsCloseOpen(false)
        toast({
          title: "Case closed",
          description: "This case has been closed successfully.",
          type: "success",
        })
      },
      onError: (err: any) => {
        toast({
          title: "Close failed",
          description: err.response?.data?.detail || "An error occurred.",
          type: "error",
        })
      },
    })
  }

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStatus) return

    overrideMutation.mutate(
      { caseId: id, newStatus: targetStatus },
      {
        onSuccess: () => {
          setIsOverrideOpen(false)
          toast({
            title: "Status overridden",
            description: "Workflow status overridden successfully.",
            type: "success",
          })
        },
        onError: (err: any) => {
          toast({
            title: "Override failed",
            description: err.response?.data?.detail || "An error occurred.",
            type: "error",
          })
        },
      }
    )
  }

  const toggleReminderExpand = (reminderId: string) => {
    setExpandedReminders((prev) => ({ ...prev, [reminderId]: !prev[reminderId] }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (isError || !c) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-6 w-6 text-destructive" />}
        title="Failed to load case workspace"
        description="Verify case ID is valid and that you have sufficient privileges to view this collection entity."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate("/collections/open")}>
              Back to cases
            </Button>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        }
      />
    )
  }

  const outstanding = c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <header className="space-y-4 border-b border-border pb-5">
        <PageBreadcrumb
          items={[
            { label: "Collections", to: "/collections" },
            { label: "Case workspace" },
          ]}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="m-0 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {c.customer?.customer_name || "Active client"}
              </h1>
              <Badge
                variant={getStatusVariant(COLLECTION_STATUS_VARIANT, c.status)}
                shape="pill"
              >
                {c.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant={getStatusVariant(PRIORITY_VARIANT, c.priority)} shape="pill">
                {c.priority}
              </Badge>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Opened {new Date(c.opened_at).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                resetActivity()
                setIsActivityOpen(true)
              }}
            >
              Log activity
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetPromise()
                setIsPromiseOpen(true)
              }}
            >
              Create promise
            </Button>

            {isManager && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTargetAssociateId(c.assigned_to || "")
                    setIsReassignOpen(true)
                  }}
                >
                  Reassign case
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-warning"
                  onClick={() => {
                    setTargetStatus(c.status)
                    setIsOverrideOpen(true)
                  }}
                >
                  Override status
                </Button>
                <Button variant="danger" size="sm" onClick={() => setIsCloseOpen(true)}>
                  Close case
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <KpiGrid>
        <KpiCard
          label="Outstanding balance"
          value={`₹${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="h-5 w-5" />}
          iconTone="destructive"
        />
        <KpiCard
          label="Aging bucket"
          value={c.aging_bucket}
          icon={<RefreshCw className="h-5 w-5" />}
          iconTone="info"
        />
        <KpiCard
          label="Owner associate"
          value={c.assigned_associate_name || "Unassigned"}
          icon={<User className="h-5 w-5" />}
          iconTone="default"
        />
        <KpiCard
          label="Opened date"
          value={new Date(c.opened_at).toLocaleDateString()}
          icon={<Calendar className="h-5 w-5" />}
          iconTone="default"
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base">Customer demographics</CardTitle>
              <CardDescription>Accounts receivable client records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Client name</span>
                <span className="font-medium text-foreground">{c.customer?.customer_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Customer code</span>
                <span className="font-mono font-medium text-foreground">
                  {c.customer?.customer_code}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Email</span>
                <span className="font-mono font-medium text-foreground">
                  {c.customer?.email || "N/A"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium text-foreground">{c.customer?.phone || "N/A"}</span>
              </div>
              <div className="space-y-1 border-t border-border pt-3">
                <span className="text-muted-foreground">Billing address</span>
                <p className="font-medium leading-relaxed text-foreground">
                  {c.customer?.billing_address || "No address listed"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base">Invoice profile</CardTitle>
              <CardDescription>Associated invoice document info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Invoice number</span>
                <Link
                  to={`/invoices/${c.invoice_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {c.invoice?.invoice_number || "INV-N/A"}
                </Link>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Invoice date</span>
                <span className="font-medium tabular-nums text-foreground">
                  {c.invoice?.invoice_date
                    ? new Date(c.invoice.invoice_date).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Due date</span>
                <span className="font-medium tabular-nums text-foreground">
                  {c.invoice?.due_date
                    ? new Date(c.invoice.due_date).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total invoiced</span>
                <span className="font-medium tabular-nums text-foreground">
                  ₹{c.invoice?.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Outstanding amount</span>
                <span className="font-semibold tabular-nums text-destructive">
                  ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Invoice status</span>
                <Badge
                  variant={c.invoice?.status === "PAID" ? "success" : "default"}
                  shape="pill"
                >
                  {c.invoice?.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="activities" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="promises">Promises</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="audit">Audit timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="activities" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
                  <div>
                    <CardTitle className="text-base">Activity logs</CardTitle>
                    <CardDescription>
                      Chronological dunning and communication logs.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      resetActivity()
                      setIsActivityOpen(true)
                    }}
                  >
                    Add log entry
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  {!c.activities || c.activities.length === 0 ? (
                    <EmptyState
                      title="No activities recorded"
                      description="Add a manual follow-up or email log to track progress."
                    />
                  ) : (
                    <Timeline>
                      {c.activities.map((act) => {
                        const config = getActivityTypeConfig(act.activity_type)
                        return (
                          <TimelineItem
                            key={act.id}
                            icon={config.icon}
                            tone={config.tone}
                            title={act.activity_type.replace(/_/g, " ")}
                            timestamp={new Date(act.created_at).toLocaleString()}
                            description={
                              <>
                                {act.notes && (
                                  <span className="mt-1 block rounded-md border border-border bg-muted/40 p-2.5">
                                    {act.notes}
                                  </span>
                                )}
                                <span className="mt-1 block text-xs">
                                  Performed by:{" "}
                                  {act.performed_by ? "Case associate" : "System automated"}
                                </span>
                              </>
                            }
                          />
                        )
                      })}
                    </Timeline>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promises" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
                  <div>
                    <CardTitle className="text-base">Payment commitments</CardTitle>
                    <CardDescription>Promised settlements registered on this case.</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      resetPromise()
                      setIsPromiseOpen(true)
                    }}
                  >
                    Add promise
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  {!c.promises || c.promises.length === 0 ? (
                    <EmptyState
                      title="No payment promises"
                      description="Set up commitment rules to track settling schedules."
                    />
                  ) : (
                    <div className="space-y-3">
                      {c.promises.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-border p-4"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-semibold tabular-nums text-foreground">
                              ₹{p.promised_amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                Target: {new Date(p.promised_date).toLocaleDateString()}
                              </span>
                              <span aria-hidden>•</span>
                              <span>
                                Created: {new Date(p.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={getStatusVariant(PROMISE_STATUS_VARIANT, p.status)}
                            shape="pill"
                          >
                            {p.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reminders" className="mt-4">
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="text-base">Case reminder history</CardTitle>
                  <CardDescription>
                    Automated dunning emails sent via Gmail for this case.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 pt-0">
                  {!c.reminders || c.reminders.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        title="No reminders"
                        description="No automated dunning alerts generated for this case."
                      />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reminder #</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Sent to</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {c.reminders.map((rem) => {
                          const isExpanded = !!expandedReminders[rem.id]
                          return (
                            <React.Fragment key={rem.id}>
                              <TableRow
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => toggleReminderExpand(rem.id)}
                                aria-expanded={isExpanded}
                              >
                                <TableCell className="font-mono tabular-nums">
                                  #{rem.reminder_number}
                                </TableCell>
                                <TableCell className="max-w-[200px] font-medium">
                                  <span className="flex items-center gap-1.5">
                                    {isExpanded ? (
                                      <ChevronUp
                                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                        aria-hidden
                                      />
                                    ) : (
                                      <ChevronDown
                                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                        aria-hidden
                                      />
                                    )}
                                    <span className={cn(!isExpanded && "truncate")}>{rem.subject}</span>
                                  </span>
                                </TableCell>
                                <TableCell className="max-w-[120px] truncate font-mono text-xs text-muted-foreground">
                                  {rem.sent_to}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={getStatusVariant(REMINDER_STATUS_VARIANT, rem.status)}
                                    shape="pill"
                                    title={getReminderStatusDescription(rem.status)}
                                  >
                                    {getReminderStatusLabel(rem.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                  {new Date(getReminderDisplayDate(rem)).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={5} className="bg-muted/30 p-4">
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground">
                                          Subject
                                        </p>
                                        <p className="text-sm font-medium text-foreground">
                                          {rem.subject}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground">
                                            Sent to
                                          </p>
                                          <p className="text-sm font-mono text-foreground">
                                            {rem.sent_to}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground">
                                            {rem.status === "SENT" ? "Sent at" : "Scheduled at"}
                                          </p>
                                          <p className="text-sm text-foreground">
                                            {new Date(getReminderDisplayDate(rem)).toLocaleString()}
                                          </p>
                                          {rem.status !== "SENT" && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                              {getReminderStatusDescription(rem.status)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground">
                                          Email body
                                        </p>
                                        <pre className="mt-1 max-h-80 overflow-y-auto rounded-md border border-border bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                                          {rem.body || "(No email body recorded)"}
                                        </pre>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="text-base">Audit trails</CardTitle>
                  <CardDescription>
                    Case workflow transitions and lifecycle records.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Timeline>
                    <TimelineItem
                      icon={<TrendingUp className="h-2.5 w-2.5" />}
                      tone="primary"
                      title="Case last updated"
                      timestamp={new Date(c.updated_at).toLocaleString()}
                    />

                    {c.escalated_at && (
                      <TimelineItem
                        icon={<ShieldAlert className="h-2.5 w-2.5" />}
                        tone="destructive"
                        title="Escalated to manager"
                        timestamp={new Date(c.escalated_at).toLocaleString()}
                        description={
                          c.escalated_manager_name
                            ? `Assigned manager: ${c.escalated_manager_name}`
                            : undefined
                        }
                      />
                    )}

                    <TimelineItem
                      icon={<User className="h-2.5 w-2.5" />}
                      tone="default"
                      title="Case assigned ownership"
                      timestamp={new Date(c.created_at).toLocaleString()}
                      description={`Assignee: ${c.assigned_associate_name}`}
                    />

                    <TimelineItem
                      icon={<CheckCircle2 className="h-2.5 w-2.5" />}
                      tone="success"
                      title="Case initialized in collections"
                      timestamp={new Date(c.opened_at).toLocaleString()}
                    />
                  </Timeline>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log activity entry</DialogTitle>
            <DialogDescription>
              Record customer communication follow-ups, calls, or dunning emails.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitActivity(handleActivitySubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="activity-type">Activity type</Label>
              <Select id="activity-type" {...registerActivity("activity_type")}>
                <option value="CALL_MADE">Phone call made</option>
                <option value="EMAIL_SENT">Manual email sent</option>
                <option value="FOLLOW_UP">Follow-up note</option>
              </Select>
              {activityErrors.activity_type && (
                <p className="text-xs text-destructive">{activityErrors.activity_type.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activity-notes">Detailed notes</Label>
              <textarea
                id="activity-notes"
                rows={4}
                {...registerActivity("notes")}
                placeholder="Discussed payment options with customer…"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
              />
              {activityErrors.notes && (
                <p className="text-xs text-destructive">{activityErrors.notes.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsActivityOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={createActivityMutation.isPending}>
                Log activity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromiseOpen} onOpenChange={setIsPromiseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register payment commitment</DialogTitle>
            <DialogDescription>
              Record the target date by which the customer has committed to settle the outstanding
              balance.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPromise(handlePromiseSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="promised-date">Commitment settlement date</Label>
              <Input id="promised-date" type="date" {...registerPromise("promised_date")} />
              {promiseErrors.promised_date && (
                <p className="text-xs text-destructive">{promiseErrors.promised_date.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsPromiseOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={createPromiseMutation.isPending}>
                Record promise
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign case owner</DialogTitle>
            <DialogDescription>
              Transfer responsibility for this case to another active Finance Associate.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reassign-associate">New associate assignee</Label>
              <Select
                id="reassign-associate"
                value={targetAssociateId}
                onChange={(e) => setTargetAssociateId(e.target.value)}
                required
              >
                <option value="">Choose associate…</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.first_name} {a.last_name} ({a.email})
                  </option>
                ))}
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsReassignOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={reassignMutation.isPending}>
                Confirm reassignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override case status</DialogTitle>
            <DialogDescription>
              Set the case collections status manually. This overrides all system rules.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="override-status">Select status</Label>
              <Select
                id="override-status"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                required
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="PROMISED">Promised</option>
                <option value="ESCALATED">Escalated</option>
                <option value="DISPUTED">Disputed</option>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsOverrideOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="border-warning/30 bg-warning-muted text-warning"
                loading={overrideMutation.isPending}
              >
                Override status
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" aria-hidden />
              Close collection case
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to close this case manually? Closing indicates resolving all
              outstanding billing disputes or payment settlements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCloseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={closeMutation.isPending}
              onClick={handleCloseSubmit}
            >
              Yes, close case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CollectionCaseDetailPage
