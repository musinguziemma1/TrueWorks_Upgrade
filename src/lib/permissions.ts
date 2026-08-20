"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/provider";

// Role-based permission map modeled after SwiftShopy's lib/permissions.ts.
// A permission is an "area:action" string; "*" grants everything. The map is
// consumed both client-side (sidebar visibility, feature gating) and mirrored
// server-side by the Convex auth checks in convex/users.ts.

export type Permission =
  | "admin:dashboard"
  | "products:read"
  | "products:manage"
  | "orders:read"
  | "orders:manage"
  | "customers:read"
  | "customers:manage"
  | "payments:read"
  | "payments:manage"
  | "returns:manage"
  | "reports:read"
  | "reports:manage"
  | "users:manage"
  | "auth:manage"
  | "audit:read"
  | "settings:manage"
  | "notifications:manage"
  | "content:manage"
  | "marketing:manage"
  | "analytics:read";

export type RolePermissions = readonly (Permission | "*")[];

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  viewer: [
    "admin:dashboard",
    "products:read",
    "orders:read",
    "customers:read",
    "analytics:read",
  ],
  editor: [
    "admin:dashboard",
    "products:read",
    "products:manage",
    "orders:read",
    "orders:manage",
    "customers:read",
    "content:manage",
    "marketing:manage",
    "analytics:read",
  ],
  admin: [
    "admin:dashboard",
    "products:read",
    "products:manage",
    "orders:read",
    "orders:manage",
    "customers:read",
    "customers:manage",
    "payments:read",
    "payments:manage",
    "returns:manage",
    "reports:read",
    "reports:manage",
    "users:manage",
    "auth:manage",
    "audit:read",
    "settings:manage",
    "notifications:manage",
    "content:manage",
    "marketing:manage",
    "analytics:read",
  ],
  owner: ["*"],
  superadmin: ["*"],
};

export function permissionsForRole(role: string | undefined): RolePermissions {
  return ROLE_PERMISSIONS[role ?? ""] ?? [];
}

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  const perms = permissionsForRole(role);
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  return useMemo(() => {
    const permissions = permissionsForRole(role);
    return {
      role,
      permissions,
      has: (permission: Permission) =>
        permissions.includes("*") || permissions.includes(permission),
    };
  }, [role]);
}