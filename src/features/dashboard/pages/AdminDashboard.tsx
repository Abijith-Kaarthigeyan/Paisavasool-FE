import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { userService } from "@/features/users/services/userService"
import { UserResponse } from "@/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { getDashboardPath } from "@/lib/navigation"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { TableSkeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { USER_ROLE_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import {
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  Briefcase,
  Plus,
  Edit2,
  Power,
  PowerOff,
  User,
  Mail,
} from "lucide-react"
import {
  internalTeamConfigService,
  INTERNAL_TEAM_CATEGORY_HINTS,
  InternalTeamContact,
} from "@/features/admin/services/internalTeamConfigService"

const createUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "FINANCE_MANAGER", "FINANCE_ASSOCIATE"] as const),
  manager_id: z.string().uuid().or(z.literal("")).optional(),
})

type CreateUserForm = z.infer<typeof createUserSchema>

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [teamEmails, setTeamEmails] = useState<Record<string, string>>({})
  const [teamConfigError, setTeamConfigError] = useState<string | null>(null)

  const { data: users = [], isLoading, error: fetchError } = useQuery<UserResponse[]>({
    queryKey: ["users"],
    queryFn: userService.listUsers,
  })

  const {
    data: internalTeamContacts = [],
    isLoading: isTeamConfigLoading,
    error: teamConfigFetchError,
  } = useQuery<InternalTeamContact[]>({
    queryKey: ["internal-team-contacts"],
    queryFn: internalTeamConfigService.listContacts,
  })

  const updateTeamConfigMutation = useMutation({
    mutationFn: internalTeamConfigService.updateContacts,
    onSuccess: (updated) => {
      queryClient.setQueryData(["internal-team-contacts"], updated)
      setTeamConfigError(null)
      toast({
        title: "Internal team emails updated",
        description: "Escalation notification recipients have been saved.",
        type: "success",
      })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; detail?: string } } }
      setTeamConfigError(
        axiosErr.response?.data?.error?.message ||
          axiosErr.response?.data?.detail ||
          "Failed to update internal team emails."
      )
    },
  })

  const createUserMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setIsCreateOpen(false)
      resetCreate()
      setActionError(null)
      toast({
        title: "User created",
        description: "The new user profile has been created successfully.",
        type: "success",
      })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; detail?: string } } }
      setActionError(
        axiosErr.response?.data?.error?.message || axiosErr.response?.data?.detail || "Failed to create user."
      )
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      userService.updateUser(id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setSelectedUser(updatedUser)
      setIsEditOpen(false)
      setActionError(null)
      toast({
        title: "User updated",
        description: "The user profile details have been updated successfully.",
        type: "success",
      })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; detail?: string } } }
      setActionError(
        axiosErr.response?.data?.error?.message || axiosErr.response?.data?.detail || "Failed to update user."
      )
    },
  })

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    watch: watchCreate,
    formState: { errors: createErrors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "FINANCE_ASSOCIATE",
      manager_id: "",
    },
  })

  const selectedRoleCreate = watchCreate("role")

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
  } = useForm<Partial<CreateUserForm> & { is_active?: boolean }>({
    defaultValues: {
      first_name: "",
      last_name: "",
      role: "FINANCE_ASSOCIATE",
      manager_id: "",
      is_active: true,
    },
  })

  const selectedRoleEdit = watchEdit("role")

  const handleOpenEdit = (user: UserResponse) => {
    resetEdit({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role.role_name,
      manager_id: user.manager_id || "",
      is_active: user.is_active,
    })
    setIsEditOpen(true)
    setActionError(null)
  }

  const onCreateSubmit = (data: CreateUserForm) => {
    setActionError(null)
    const payload = {
      ...data,
      manager_id: data.manager_id && data.manager_id !== "" ? data.manager_id : null,
    }
    createUserMutation.mutate(payload)
  }

  const onEditSubmit = (data: Partial<CreateUserForm> & { is_active?: boolean }) => {
    if (!selectedUser) return
    setActionError(null)
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
      manager_id: data.manager_id && data.manager_id !== "" ? data.manager_id : null,
      is_active: data.is_active,
    }
    updateUserMutation.mutate({ id: selectedUser.id, data: payload })
  }

  const toggleUserStatus = (user: UserResponse) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
    })
  }

  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.is_active).length
  const inactiveUsers = totalUsers - activeUsers
  const financeManagers = users.filter((u) => u.role.role_name === "FINANCE_MANAGER").length
  const financeAssociates = users.filter((u) => u.role.role_name === "FINANCE_ASSOCIATE").length

  const activeManagersList = users.filter(
    (u) => u.role.role_name === "FINANCE_MANAGER" && u.is_active
  )

  React.useEffect(() => {
    if (internalTeamContacts.length === 0) return
    setTeamEmails(
      Object.fromEntries(internalTeamContacts.map((team) => [team.team_key, team.email]))
    )
  }, [internalTeamContacts])

  const handleSaveTeamEmails = () => {
    setTeamConfigError(null)
    updateTeamConfigMutation.mutate(
      internalTeamContacts.map((team) => ({
        team_key: team.team_key,
        email: teamEmails[team.team_key] ?? team.email,
      }))
    )
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "System administration" },
        ]}
      />

      <PageHeader
        title="System administration"
        description="Manage user profiles, assign organizational reporting hierarchies, configure roles, and set internal team escalation emails."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetCreate()
              setIsCreateOpen(true)
              setActionError(null)
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create user
          </Button>
        }
      />

      <KpiGrid columns={5}>
        <KpiCard
          label="Total users"
          value={totalUsers}
          icon={<Users className="h-5 w-5" />}
          loading={isLoading}
        />
        <KpiCard
          label="Active users"
          value={activeUsers}
          icon={<UserCheck className="h-5 w-5" />}
          iconTone="success"
          loading={isLoading}
        />
        <KpiCard
          label="Inactive users"
          value={inactiveUsers}
          icon={<UserX className="h-5 w-5" />}
          iconTone="destructive"
          loading={isLoading}
        />
        <KpiCard
          label="Managers"
          value={financeManagers}
          icon={<ShieldAlert className="h-5 w-5" />}
          iconTone="primary"
          loading={isLoading}
        />
        <KpiCard
          label="Associates"
          value={financeAssociates}
          icon={<Briefcase className="h-5 w-5" />}
          iconTone="warning"
          loading={isLoading}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="mb-4 border-b border-border pb-3">
            <CardTitle>User accounts directory</CardTitle>
            <CardDescription>View, edit profiles, and activate or deactivate access.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : fetchError ? (
              <EmptyState
                title="Failed to load users"
                description="Please ensure the Auth microservice is running."
              />
            ) : users.length === 0 ? (
              <EmptyState
                title="No users found"
                description="Create a user to get started."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow
                      key={userItem.id}
                      data-state={selectedUser?.id === userItem.id ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => setSelectedUser(userItem)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {userItem.first_name} {userItem.last_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {userItem.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(USER_ROLE_VARIANT, userItem.role.role_name)}
                          shape="pill"
                        >
                          {userItem.role.role_name.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={userItem.is_active ? "success" : "destructive"}
                          shape="pill"
                        >
                          {userItem.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(userItem)}
                          >
                            <Edit2 className="h-3 w-3" aria-hidden />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={
                              userItem.is_active
                                ? "text-destructive hover:text-destructive"
                                : "text-success hover:text-success"
                            }
                            onClick={() => toggleUserStatus(userItem)}
                          >
                            {userItem.is_active ? (
                              <>
                                <PowerOff className="h-3 w-3" aria-hidden />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="h-3 w-3" aria-hidden />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="mb-4 border-b border-border pb-3">
            <CardTitle>Selected profile</CardTitle>
            <CardDescription>Audit metadata and organizational structure.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                    {selectedUser.first_name[0]}
                    {selectedUser.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold leading-tight text-foreground">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Email</span>
                    <span className="truncate font-mono text-xs font-medium text-foreground">
                      {selectedUser.email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">System role</span>
                    <Badge
                      variant={getStatusVariant(USER_ROLE_VARIANT, selectedUser.role.role_name)}
                      shape="pill"
                    >
                      {selectedUser.role.role_name.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Reporting manager</span>
                    <span className="text-right text-xs font-medium text-foreground">
                      {selectedUser.manager_id ? (
                        users.find((u) => u.id === selectedUser.manager_id)
                          ? `${users.find((u) => u.id === selectedUser.manager_id)?.first_name} ${users.find((u) => u.id === selectedUser.manager_id)?.last_name}`
                          : "Assigned manager"
                      ) : (
                        "None (direct)"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account status</span>
                    <Badge
                      variant={selectedUser.is_active ? "success" : "destructive"}
                      shape="pill"
                    >
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] text-muted-foreground">
                  <div>Created: {new Date(selectedUser.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(selectedUser.updated_at).toLocaleString()}</div>
                  <div>
                    Last login:{" "}
                    {selectedUser.last_login_at
                      ? new Date(selectedUser.last_login_at).toLocaleString()
                      : "Never logged in"}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<User className="h-6 w-6" />}
                title="No user selected"
                description="Select a user from the directory to review profile metadata."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="mb-4 border-b border-border pb-3">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" aria-hidden />
            Internal team notification emails
          </CardTitle>
          <CardDescription>
            Configure where dispute escalation emails are sent for each internal team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {teamConfigError && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              {teamConfigError}
            </div>
          )}

          {isTeamConfigLoading ? (
            <TableSkeleton rows={3} columns={2} />
          ) : teamConfigFetchError ? (
            <EmptyState
              title="Failed to load internal team emails"
              description="Ensure the Dispute service is running and the database migration has been applied."
            />
          ) : internalTeamContacts.length === 0 ? (
            <EmptyState
              title="No internal teams configured"
              description="Run the latest dispute-service database migration to seed default team contacts."
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {internalTeamContacts.map((team) => (
                  <div key={team.team_key} className="space-y-2 rounded-lg border border-border p-4">
                    <div>
                      <Label htmlFor={`team-email-${team.team_key}`}>{team.display_name}</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {INTERNAL_TEAM_CATEGORY_HINTS[team.team_key]}
                      </p>
                    </div>
                    <Input
                      id={`team-email-${team.team_key}`}
                      type="email"
                      value={teamEmails[team.team_key] ?? team.email}
                      onChange={(event) =>
                        setTeamEmails((current) => ({
                          ...current,
                          [team.team_key]: event.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  loading={updateTeamConfigMutation.isPending}
                  onClick={handleSaveTeamEmails}
                >
                  {updateTeamConfigMutation.isPending ? "Saving…" : "Save team emails"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create user profile</DialogTitle>
            <DialogDescription>Register a new system user and assign roles.</DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              {actionError}
            </div>
          )}

          <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="create-first-name">First name</Label>
                <Input id="create-first-name" type="text" {...registerCreate("first_name")} />
                {createErrors.first_name && (
                  <span className="mt-1 block text-xs text-destructive">
                    {createErrors.first_name.message}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-last-name">Last name</Label>
                <Input id="create-last-name" type="text" {...registerCreate("last_name")} />
                {createErrors.last_name && (
                  <span className="mt-1 block text-xs text-destructive">
                    {createErrors.last_name.message}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email address</Label>
              <Input id="create-email" type="email" {...registerCreate("email")} />
              {createErrors.email && (
                <span className="mt-1 block text-xs text-destructive">
                  {createErrors.email.message}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-password">Initial password</Label>
              <Input id="create-password" type="password" {...registerCreate("password")} />
              {createErrors.password && (
                <span className="mt-1 block text-xs text-destructive">
                  {createErrors.password.message}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-role">Access role</Label>
              <Select id="create-role" {...registerCreate("role")}>
                <option value="ADMIN">Admin</option>
                <option value="FINANCE_MANAGER">Finance manager</option>
                <option value="FINANCE_ASSOCIATE">Finance associate</option>
              </Select>
            </div>

            {selectedRoleCreate === "FINANCE_ASSOCIATE" && (
              <div className="space-y-1.5">
                <Label htmlFor="create-manager">Reporting manager</Label>
                <Select id="create-manager" {...registerCreate("manager_id")}>
                  <option value="">Select a manager (or none)</option>
                  {activeManagersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </Select>
                {createErrors.manager_id && (
                  <span className="mt-1 block text-xs text-destructive">
                    {createErrors.manager_id.message}
                  </span>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Saving…" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user profile</DialogTitle>
            <DialogDescription>Modify reporting structure or role allocations.</DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              {actionError}
            </div>
          )}

          {selectedUser && (
            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-first-name">First name</Label>
                  <Input id="edit-first-name" type="text" {...registerEdit("first_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-last-name">Last name</Label>
                  <Input id="edit-last-name" type="text" {...registerEdit("last_name")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-role">System role</Label>
                <Select id="edit-role" {...registerEdit("role")}>
                  <option value="ADMIN">Admin</option>
                  <option value="FINANCE_MANAGER">Finance manager</option>
                  <option value="FINANCE_ASSOCIATE">Finance associate</option>
                </Select>
              </div>

              {selectedRoleEdit === "FINANCE_ASSOCIATE" && (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-manager">Reporting manager</Label>
                  <Select id="edit-manager" {...registerEdit("manager_id")}>
                    <option value="">Select a manager (or none)</option>
                    {activeManagersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  {...registerEdit("is_active")}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring/30"
                />
                <Label htmlFor="is_active_edit" className="font-normal">
                  User account active
                </Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminDashboard
