import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Server-side auth helpers for Next.js layouts and route handlers. They
// validate the HttpOnly IAM session cookie against the Convex /iam/me
// endpoint, so server code never trusts the client for authorization.

export interface AuthUser {
  _id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  createdAt?: number;
}

export const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 5,
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const STAFF_ROLES = ["superadmin", "owner", "admin", "editor"];
export const ADMIN_ROLES = ["superadmin", "owner", "admin"];

function getConvexSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return (process.env.NEXT_PUBLIC_CONVEX_URL ?? "")
    .replace(/\.convex\.cloud\/?$/, ".convex.site")
    .replace(/\/$/, "");
}

function roleLevel(role: string | undefined): number {
  return ROLE_HIERARCHY[role ?? ""] ?? 0;
}

export function hasRole(user: Pick<AuthUser, "role"> | null, roles: string[]): boolean {
  return !!user && roles.includes(user.role);
}

export function isAtLeast(user: Pick<AuthUser, "role"> | null, role: string): boolean {
  return !!user && roleLevel(user.role) >= roleLevel(role);
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("tw_session")?.value;
  if (!sessionCookie) return null;

  const convexSiteUrl = getConvexSiteUrl();
  if (!convexSiteUrl) return null;

  try {
    const res = await fetch(`${convexSiteUrl}/iam/me`, {
      method: "GET",
      headers: { cookie: `tw_session=${sessionCookie}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireRole(...roles: string[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export async function requireStaff(): Promise<AuthUser> {
  return await requireRole(...STAFF_ROLES);
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (roleLevel(user.role) < roleLevel("admin")) redirect("/");
  return user;
}