import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { userService } from "@/features/users/services/userService"
import { UserResponse } from "@/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
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
  User 
} from "lucide-react"

// Form schemas
const createUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "FINANCE_MANAGER", "FINANCE_ASSOCIATE"] as const),
  manager_id: z.string().uuid().or(z.literal("")).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN": return "destructive";
      case "FINANCE_MANAGER": return "success";
      case "FINANCE_ASSOCIATE": return "default";
      default: return "outline";
    }
  };

  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch users list
  const { data: users = [], isLoading, error: fetchError } = useQuery<UserResponse[]>({
    queryKey: ["users"],
    queryFn: userService.listUsers,
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsCreateOpen(false);
      resetCreate();
      setActionError(null);
      toast({
        title: "User created",
        description: "The new user profile has been created successfully.",
        type: "success",
      });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || err.response?.data?.detail || "Failed to create user.");
    },
  });

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userService.updateUser(id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedUser(updatedUser);
      setIsEditOpen(false);
      setActionError(null);
      toast({
        title: "User updated",
        description: "The user profile details have been updated successfully.",
        type: "success",
      });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || err.response?.data?.detail || "Failed to update user.");
    },
  });

  // Forms setup
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
  });

  const selectedRoleCreate = watchCreate("role");

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
  });

  const selectedRoleEdit = watchEdit("role");

  const handleOpenEdit = (user: UserResponse) => {
    resetEdit({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role.role_name,
      manager_id: user.manager_id || "",
      is_active: user.is_active,
    });
    setIsEditOpen(true);
    setActionError(null);
  };

  const onCreateSubmit = (data: CreateUserForm) => {
    setActionError(null);
    const payload = {
      ...data,
      manager_id: data.manager_id && data.manager_id !== "" ? data.manager_id : null,
    };
    createUserMutation.mutate(payload);
  };

  const onEditSubmit = (data: any) => {
    if (!selectedUser) return;
    setActionError(null);
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
      manager_id: data.manager_id && data.manager_id !== "" ? data.manager_id : null,
      is_active: data.is_active,
    };
    updateUserMutation.mutate({ id: selectedUser.id, data: payload });
  };

  const toggleUserStatus = (user: UserResponse) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
    });
  };

  // KPI summaries calculations
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const financeManagers = users.filter((u) => u.role.role_name === "FINANCE_MANAGER").length;
  const financeAssociates = users.filter((u) => u.role.role_name === "FINANCE_ASSOCIATE").length;

  const activeManagersList = users.filter((u) => u.role.role_name === "FINANCE_MANAGER" && u.is_active);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            System Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user profiles, assign organizational reporting hierarchies, and configure roles.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              resetCreate();
              setIsCreateOpen(true);
              setActionError(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" /> Create User
          </button>
        </div>
      </header>

      {/* User Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Users</span>
              <p className="text-2xl font-bold text-foreground">{isLoading ? "..." : totalUsers}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Users</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{isLoading ? "..." : activeUsers}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inactive Users</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{isLoading ? "..." : inactiveUsers}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <UserX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Managers</span>
              <p className="text-2xl font-bold text-primary">{isLoading ? "..." : financeManagers}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xs transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Associates</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{isLoading ? "..." : financeAssociates}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Briefcase className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: User List + User Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Table Card */}
        <Card className="lg:col-span-2 shadow-xs border-border">
          <CardHeader className="pb-3 border-b border-border mb-4">
            <CardTitle>User Accounts Directory</CardTitle>
            <CardDescription>View, edit profiles, and activate/deactivate access states.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : fetchError ? (
              <div className="text-center py-12 text-rose-500 font-semibold border rounded-lg bg-rose-500/5 border-rose-500/20">
                Failed to load user directory. Please ensure the Auth microservice is running.
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                      <th className="pb-3 px-3">Name</th>
                      <th className="pb-3 px-3">Email</th>
                      <th className="pb-3 px-3">Role</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((userItem) => (
                      <tr
                        key={userItem.id}
                        onClick={() => setSelectedUser(userItem)}
                        className={`hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors ${
                          selectedUser?.id === userItem.id ? "bg-primary/5 hover:bg-primary/5" : ""
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {userItem.first_name} {userItem.last_name}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground font-mono text-xs">{userItem.email}</td>
                        <td className="py-3 px-3">
                          <Badge variant={getRoleBadgeVariant(userItem.role.role_name)} className="text-[10px] uppercase py-0 px-2 font-bold">
                            {userItem.role.role_name.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={userItem.is_active ? "success" : "destructive"} className="text-[10px] py-0 px-2 font-bold">
                            {userItem.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleOpenEdit(userItem)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            >
                              <Edit2 className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => toggleUserStatus(userItem)}
                              className={`inline-flex items-center gap-1 text-xs font-bold hover:underline ${
                                userItem.is_active ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {userItem.is_active ? (
                                <>
                                  <PowerOff className="h-3 w-3" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="h-3 w-3" /> Activate
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Sidebar */}
        <Card className="shadow-xs border-border h-fit">
          <CardHeader className="pb-3 border-b border-border mb-4">
            <CardTitle>Selected Profile Info</CardTitle>
            <CardDescription>Audit metadata and organizational structure.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg">
                    {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-tight">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h3>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-semibold text-foreground font-mono text-xs">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">System Role:</span>
                    <Badge variant={getRoleBadgeVariant(selectedUser.role.role_name)} className="uppercase font-bold text-[10px]">
                      {selectedUser.role.role_name.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reporting Manager:</span>
                    <span className="font-semibold text-foreground text-xs">
                      {selectedUser.manager_id ? (
                        users.find(u => u.id === selectedUser.manager_id)
                          ? `${users.find(u => u.id === selectedUser.manager_id)?.first_name} ${users.find(u => u.id === selectedUser.manager_id)?.last_name}`
                          : "Assigned Manager"
                      ) : (
                        "None (Direct)"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Status:</span>
                    <Badge variant={selectedUser.is_active ? "success" : "destructive"} className="text-[10px] font-bold">
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-[11px] font-mono text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/40 p-3 rounded-lg">
                  <div>Created: {new Date(selectedUser.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(selectedUser.updated_at).toLocaleString()}</div>
                  <div>
                    Last Login:{" "}
                    {selectedUser.last_login_at
                      ? new Date(selectedUser.last_login_at).toLocaleString()
                      : "Never logged in"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <User className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-3" />
                Select a user from the directory to review profile metadata and lineage.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User Profile</DialogTitle>
            <DialogDescription>Register a new system user and assign roles.</DialogDescription>
          </DialogHeader>
          
          {actionError && (
            <div className="rounded-md bg-rose-50 dark:bg-rose-950/20 p-3 text-rose-700 dark:text-rose-400 text-xs font-semibold mb-4 border border-rose-500/20">
              {actionError}
            </div>
          )}

          <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                <input
                  type="text"
                  {...registerCreate("first_name")}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
                {createErrors.first_name && (
                  <span className="text-xs text-rose-500 mt-1 block">{createErrors.first_name.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                <input
                  type="text"
                  {...registerCreate("last_name")}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
                {createErrors.last_name && (
                  <span className="text-xs text-rose-500 mt-1 block">{createErrors.last_name.message}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
              <input
                type="email"
                {...registerCreate("email")}
                className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
              {createErrors.email && (
                <span className="text-xs text-rose-500 mt-1 block">{createErrors.email.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Password</label>
              <input
                type="password"
                {...registerCreate("password")}
                className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
              {createErrors.password && (
                <span className="text-xs text-rose-500 mt-1 block">{createErrors.password.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Role</label>
              <select
                {...registerCreate("role")}
                className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
                <option value="FINANCE_ASSOCIATE">FINANCE_ASSOCIATE</option>
              </select>
            </div>

            {selectedRoleCreate === "FINANCE_ASSOCIATE" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Reporting Manager</label>
                <select
                  {...registerCreate("manager_id")}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                >
                  <option value="">Select a Manager (Or None)</option>
                  {activeManagersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>
                {createErrors.manager_id && (
                  <span className="text-xs text-rose-500 mt-1 block">{createErrors.manager_id.message}</span>
                )}
              </div>
            )}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                {createUserMutation.isPending ? "Saving..." : "Create User"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Modify reporting structure or role allocations.</DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="rounded-md bg-rose-50 dark:bg-rose-950/20 p-3 text-rose-700 dark:text-rose-400 text-xs font-semibold mb-4 border border-rose-500/20">
              {actionError}
            </div>
          )}

          {selectedUser && (
            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                  <input
                    type="text"
                    {...registerEdit("first_name")}
                    className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                  <input
                    type="text"
                    {...registerEdit("last_name")}
                    className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">System Role</label>
                <select
                  {...registerEdit("role")}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
                  <option value="FINANCE_ASSOCIATE">FINANCE_ASSOCIATE</option>
                </select>
              </div>

              {selectedRoleEdit === "FINANCE_ASSOCIATE" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Reporting Manager</label>
                  <select
                    {...registerEdit("manager_id")}
                    className="mt-1.5 w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                  >
                    <option value="">Select a Manager (Or None)</option>
                    {activeManagersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  {...registerEdit("is_active")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_active_edit" className="text-xs font-bold uppercase tracking-wider text-foreground">
                  User Account Active
                </label>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
