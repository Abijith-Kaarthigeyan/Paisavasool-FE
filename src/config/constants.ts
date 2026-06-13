export const ROLES = {
  ADMIN: "ADMIN",
  FINANCE_MANAGER: "FINANCE_MANAGER",
  FINANCE_ASSOCIATE: "FINANCE_ASSOCIATE",
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
} as const;
