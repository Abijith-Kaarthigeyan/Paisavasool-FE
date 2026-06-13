export type RoleName = "ADMIN" | "FINANCE_MANAGER" | "FINANCE_ASSOCIATE";

export interface RoleResponse {
  id: string;
  role_name: RoleName;
  description: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: RoleResponse;
  manager_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: RoleName;
  manager_id?: string | null;
}

export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  role?: RoleName;
  manager_id?: string | null;
  is_active?: boolean;
}

export interface TokenResponse {
  message: string;
  expires_in: number;
}
