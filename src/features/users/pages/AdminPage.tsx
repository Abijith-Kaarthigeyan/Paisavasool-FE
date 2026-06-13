import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { userService } from "@/features/users/services/userService"
import { authService } from "@/features/auth/services/authService"
import { clearCredentials } from "@/features/auth/slices/authSlice"
import { UserResponse } from "@/types"

// Zod schemas for validation
const createUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "FINANCE_MANAGER", "FINANCE_ASSOCIATE"] as const),
  manager_id: z.string().uuid().or(z.literal("")).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Get user list from server
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
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || err.response?.data?.detail || "Failed to update user.");
    },
  });

  // Forms
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

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      dispatch(clearCredentials());
      navigate("/login");
    }
  };

  const onCreateSubmit = (data: CreateUserForm) => {
    setActionError(null);
    // Convert empty string to null for manager_id
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

  // Find active managers for manager selection dropdown
  const managers = users.filter((u) => u.role.role_name === "FINANCE_MANAGER" && u.is_active);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-sans">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Admin Control Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Auth Service User Management & RBAC Testing
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetCreate();
                setIsCreateOpen(true);
                setActionError(null);
              }}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Create User
            </button>
            <button
              onClick={handleLogout}
              className="rounded bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {actionError && (
          <div className="rounded-md bg-rose-50 dark:bg-rose-950/20 p-4 text-rose-700 dark:text-rose-400 text-sm">
            <span className="font-bold">Error: </span>
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List Panel */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">User List</h2>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : fetchError ? (
              <div className="text-rose-500 text-center py-8">
                Failed to retrieve users list. Verify the auth microservice is running.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold">
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">Role</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((userItem) => (
                      <tr
                        key={userItem.id}
                        onClick={() => setSelectedUser(userItem)}
                        className={`hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors ${
                          selectedUser?.id === userItem.id ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="py-3 px-2 font-medium text-foreground">
                          {userItem.first_name} {userItem.last_name}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{userItem.email}</td>
                        <td className="py-3 px-2">
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {userItem.role.role_name}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              userItem.is_active
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                            }`}
                          >
                            {userItem.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEdit(userItem)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleUserStatus(userItem)}
                            className={`text-xs font-semibold hover:underline ${
                              userItem.is_active ? "text-rose-500" : "text-emerald-500"
                            }`}
                          >
                            {userItem.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Detail Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-foreground mb-4">User Details</h2>
            {selectedUser ? (
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">{selectedUser.id}</span>
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-foreground">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-bold text-primary">{selectedUser.role.role_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manager ID:</span>
                    <span className="font-mono text-zinc-400 text-xs truncate max-w-[150px]">
                      {selectedUser.manager_id || "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={`font-semibold ${
                        selectedUser.is_active ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2 text-xs font-mono text-muted-foreground">
                  <div>Created: {new Date(selectedUser.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(selectedUser.updated_at).toLocaleString()}</div>
                  <div>
                    Last Login:{" "}
                    {selectedUser.last_login_at
                      ? new Date(selectedUser.last_login_at).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a user from the list to view active profile metadata.
              </p>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-foreground mb-4">Create User Profile</h2>
              <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">First Name</label>
                  <input
                    type="text"
                    {...registerCreate("first_name")}
                    className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                  />
                  {createErrors.first_name && (
                    <span className="text-xs text-rose-500">{createErrors.first_name.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Last Name</label>
                  <input
                    type="text"
                    {...registerCreate("last_name")}
                    className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                  />
                  {createErrors.last_name && (
                    <span className="text-xs text-rose-500">{createErrors.last_name.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Email</label>
                  <input
                    type="email"
                    {...registerCreate("email")}
                    className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                  />
                  {createErrors.email && (
                    <span className="text-xs text-rose-500">{createErrors.email.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Password</label>
                  <input
                    type="password"
                    {...registerCreate("password")}
                    className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                  />
                  {createErrors.password && (
                    <span className="text-xs text-rose-500">{createErrors.password.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Role</label>
                  <select
                    {...registerCreate("role")}
                    className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
                    <option value="FINANCE_ASSOCIATE">FINANCE_ASSOCIATE</option>
                  </select>
                </div>

                {selectedRoleCreate === "FINANCE_ASSOCIATE" && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground">Manager</label>
                    <select
                      {...registerCreate("manager_id")}
                      className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a Manager</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.first_name} {m.last_name} (Manager)
                        </option>
                      ))}
                    </select>
                    {createErrors.manager_id && (
                      <span className="text-xs text-rose-500">{createErrors.manager_id.message}</span>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50"
                  >
                    {createUserMutation.isPending ? "Creating..." : "Save User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {isEditOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-foreground mb-4">Edit User Profile</h2>
              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">First Name</label>
                  <input
                    type="text"
                    {...registerEdit("first_name")}
                    className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Last Name</label>
                  <input
                    type="text"
                    {...registerEdit("last_name")}
                    className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Role</label>
                  <select
                    {...registerEdit("role")}
                    className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
                    <option value="FINANCE_ASSOCIATE">FINANCE_ASSOCIATE</option>
                  </select>
                </div>

                {selectedRoleEdit === "FINANCE_ASSOCIATE" && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground">Manager</label>
                    <select
                      {...registerEdit("manager_id")}
                      className="mt-1 w-full rounded border border-input bg-background p-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a Manager</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.first_name} {m.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    {...registerEdit("is_active")}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-foreground">
                    User Active Status
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="rounded bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50"
                  >
                    {updateUserMutation.isPending ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
