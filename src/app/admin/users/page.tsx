"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@/lib/auth/provider";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Shield, Search, UserPlus, Trash2, Ban, CheckCircle, LogOut,
  MoreVertical, Mail, Clock, XCircle, RefreshCw,
  ChevronRight, Grid3X3, List, Loader2, BarChart3, UserCheck,
  Edit3, X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  owner: "Owner",
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-red-100 text-red-800 border-red-200",
  owner: "bg-amber-100 text-amber-800 border-amber-200",
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  editor: "bg-blue-100 text-blue-800 border-blue-200",
  viewer: "bg-secondary text-secondary-foreground border-border",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  superadmin: "Full system access. Can manage all users including owners and other superadmins.",
  owner: "Full access to everything. Cannot be demoted or deleted.",
  admin: "Full access except user management and settings.",
  editor: "Can manage products, content, resources, and orders.",
  viewer: "Read-only access to the dashboard.",
};

function initials(name?: string, email?: string) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+|@/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")) || "?";
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTimeRemaining(expiresAt: number) {
  const now = Date.now();
  const diff = expiresAt - now;
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m remaining`;
}

const ROLE_DOT: Record<string, string> = {
  superadmin: "#dc2626",
  owner: "#d97706",
  admin: "#7c3aed",
  editor: "#2563eb",
  viewer: "#64748b",
};

function roleDotColor(role: string) {
  return ROLE_DOT[role] ?? "#64748b";
}

function countsByRole(
  list: ReadonlyArray<{ role: string }>,
  role: string
) {
  return list.filter((u) => u.role === role).length;
}

export default function UsersPage() {
  const users = useQuery(api.users.list);
  const me = useQuery(api.users.current);
  const invitations = useQuery(api.invitations.listAll);
  const { logout } = useAuth();
  const setRole = useMutation(api.users.setRole);
  const suspendUser = useMutation(api.users.suspendUser);
  const activateUser = useMutation(api.users.activateUser);
  const deleteUser = useMutation(api.users.deleteUser);
  const inviteUser = useMutation(api.users.inviteUser);
  const revokeInvitation = useMutation(api.invitations.revoke);
  const resendInvitation = useMutation(api.invitations.resend);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [inviteOpen, setInviteOpen] = useState(false);
  // Captured once per mount so invitation expiry checks stay pure during render.
  const [nowTs] = useState(() => Date.now());
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [deleteTarget, setDeleteTarget] = useState<Id<"users"> | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const perPage = 10;

  const isLoading = users === undefined;
  const filtered = (users ?? []).filter(
    (u) =>
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const isSuperAdmin = me?.role === "superadmin";
  const isOwner = me?.role === "owner";
  const isAdmin = me?.role === "admin" || me?.role === "owner" || me?.role === "superadmin";
  const canManageUsers = isSuperAdmin || isOwner || isAdmin;

  // Pending invitations (not accepted, not expired, not revoked)
  const pendingInvitations = (invitations ?? []).filter(
    (inv) => inv.status === "pending" && inv.expiresAt > nowTs
  );

  // Role counts derived from the full user list (not the filtered search view)
  const allUsers = users ?? [];
  const counts = {
    total: allUsers.length,
    active: allUsers.filter((u) => u.status !== "suspended").length,
    admins: allUsers.filter((u) => u.role === "admin" || u.role === "owner" || u.role === "superadmin").length,
    editors: allUsers.filter((u) => u.role === "editor").length,
    viewers: allUsers.filter((u) => u.role === "viewer").length,
    suspended: allUsers.filter((u) => u.status === "suspended").length,
  };

  async function changeRole(userId: Id<"users">, role: "superadmin" | "owner" | "admin" | "editor" | "viewer") {
    try {
      await setRole({ userId, role });
      toast.success(`Role updated to ${ROLE_LABELS[role]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    }
  }

  async function handleSuspend(userId: Id<"users">) {
    try {
      await suspendUser({ userId });
      toast.success("User suspended");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to suspend user");
    }
  }

  async function handleActivate(userId: Id<"users">) {
    try {
      await activateUser({ userId });
      toast.success("User activated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to activate user");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteUser({ userId: deleteTarget });
      toast.success("User deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      await inviteUser({ email: inviteEmail.trim(), role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invitation");
    }
  }

  async function handleRevoke(invitationId: Id<"invitations">) {
    try {
      await revokeInvitation({ invitationId });
      toast.success("Invitation revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke invitation");
    }
  }

  async function handleResend(invitationId: Id<"invitations">) {
    try {
      await resendInvitation({ invitationId });
      toast.success("Invitation resent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to resend invitation");
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#071A33] to-[#071A33] px-6 py-8 lg:px-8 lg:py-10">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-accent/[0.10] blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[24rem] w-[24rem] rounded-full bg-blue-500/[0.10] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.05] blur-3xl" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "400px 400px",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-white/60">
              <Link href="/admin" className="transition-colors hover:text-white">Dashboard</Link>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="font-semibold text-white">Users &amp; Roles</span>
            </nav>
            <h1 className="mt-3 font-heading text-3xl font-semibold text-white md:text-4xl">
              Users &amp; Roles
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Manage who can access the admin panel and what they can do.
            </p>
            {canManageUsers && pendingInvitations.length > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-light">
                <Mail className="h-3 w-3" />
                {pendingInvitations.length} pending invitation{pendingInvitations.length === 1 ? "" : "s"}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canManageUsers && (
              <Button
                onClick={() => setInviteOpen(true)}
                className="gradient-gold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
              >
                <UserPlus className="h-4 w-4" /> Invite User
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Stats row: featured Active users + 2x2 secondary ──── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="gradient-brand relative overflow-hidden rounded-2xl p-6 shadow-elevated">
          <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">
                Active users
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent-light">
                <UserCheck className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 font-heading text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">
              {counts.active}
            </p>
            <p className="mt-2 text-xs text-white/70">
              Across {counts.total} {counts.total === 1 ? "team member" : "team members"} · {counts.suspended} suspended
            </p>
            <Link
              href="/admin/settings?tab=security"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-light transition-transform hover:translate-x-0.5"
            >
              Review access policy
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {[
            { label: "Admins", value: counts.admins, icon: Shield, tint: "text-purple-700 bg-purple-50", footnote: "Admin + Owner + Super" },
            { label: "Editors", value: counts.editors, icon: Edit3, tint: "text-blue-700 bg-blue-50", footnote: "Manage content" },
            { label: "Viewers", value: counts.viewers, icon: UserCheck, tint: "text-muted-foreground bg-muted", footnote: "Read only" },
            { label: "Suspended", value: counts.suspended, icon: Ban, tint: "text-red-700 bg-red-50", footnote: "Access revoked" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.tint)}>
                    <s.icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{s.footnote}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── Roles & access legend ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </span>
            <CardTitle>Roles &amp; access</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(ROLE_LABELS).map(([role, label], i) => (
            <div
              key={role}
              className={cn(
                "flex flex-wrap items-start gap-3 rounded-xl border border-border/60 bg-surface px-3.5 py-3 sm:flex-nowrap sm:items-center",
                i === 0 && "rounded-t-xl"
              )}
            >
              <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: roleDotColor(role) }} />
              <div className="min-w-[8.5rem] shrink-0">
                <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold", ROLE_COLORS[role])}>
                  {label}
                </span>
              </div>
              <p className="flex-1 text-xs text-muted-foreground sm:text-sm">
                {ROLE_DESCRIPTIONS[role]}
              </p>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
                {countsByRole(allUsers, role)} member{countsByRole(allUsers, role) === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {canManageUsers && pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", ROLE_COLORS[inv.role])}>
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.invitedByName || inv.invitedBy}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {fmtTimeRemaining(inv.expiresAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isSuperAdmin && (
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResend(inv._id)}
                            title="Resend invitation"
                            aria-label={`Resend invitation to ${inv.email}`}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(inv._id)}
                            title="Revoke invitation"
                            className="text-red-600 hover:text-red-700"
                            aria-label={`Revoke invitation to ${inv.email}`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ─── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:flex-wrap lg:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="h-10 pl-10 pr-9"
            aria-label="Search users"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setPage(1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">
            View
          </span>
          <div className="flex overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2.5 transition-colors",
                viewMode === "list" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-foreground"
              )}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2.5 transition-colors",
                viewMode === "grid" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-foreground"
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Users (list / grid) ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <UserCheck className="h-4 w-4" />
            </span>
            <CardTitle>Team</CardTitle>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            {filtered.length} {filtered.length === 1 ? "user" : "users"} found
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : viewMode === "list" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Logins</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((u) => {
                  const isSelf = me?._id === u._id;
                  const isTargetOwner = u.role === "owner";
                  const isTargetSuperAdmin = u.role === "superadmin";
                  // Only superadmin can manage superadmins and owners
                  const canManage = !isSelf && !isTargetOwner && !isTargetSuperAdmin && canManageUsers;
                  // Superadmin-only actions: suspend, activate, delete
                  const canSuspendDelete = !isSelf && !isTargetOwner && !isTargetSuperAdmin && isSuperAdmin;
                  const isSuspended = u.status === "suspended";

                  return (
                    <TableRow key={u._id} className={cn("group transition-colors", isSuspended ? "opacity-70" : "hover:bg-muted/40")}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-white">
                            {u.avatar && (
                              <AvatarImage src={u.avatar} alt={u.name ?? u.email} />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary text-xs font-bold text-white">
                              {initials(u.name, u.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{u.name ?? "—"}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            {isSelf && (
                              <span className="mt-0.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", ROLE_COLORS[u.role])}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold",
                            isSuspended
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", isSuspended ? "bg-red-500" : "bg-emerald-500")} />
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {fmtDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold tabular-nums">
                        {u.loginCount ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage ? (
                          <DropdownMenu>
                          <DropdownMenuTrigger
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Actions for ${u.name ?? u.email}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <div className="px-2 py-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Change Role</p>
                              </div>
                              {(["admin", "editor", "viewer"] as const).map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => changeRole(u._id, role)}
                                  disabled={u.role === role}
                                >
                                  <span className={cn("mr-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold", ROLE_COLORS[role])}>
                                    {ROLE_LABELS[role]}
                                  </span>
                                  {u.role === role && <CheckCircle className="ml-auto h-3.5 w-3.5" />}
                                </DropdownMenuItem>
                              ))}
                              {isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Superadmin Actions</p>
                                  </div>
                                  <DropdownMenuItem
                                    onClick={() => changeRole(u._id, "superadmin")}
                                    disabled={u.role === "superadmin"}
                                  >
                                    <span className={cn("mr-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold", ROLE_COLORS.superadmin)}>
                                      Superadmin
                                    </span>
                                    {u.role === "superadmin" && <CheckCircle className="ml-auto h-3.5 w-3.5" />}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {canSuspendDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  {isSuspended ? (
                                    <DropdownMenuItem onClick={() => handleActivate(u._id)}>
                                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                      Activate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleSuspend(u._id)}>
                                      <Ban className="mr-2 h-4 w-4 text-orange-600" />
                                      Suspend
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeleteTarget(u._id);
                                      setDeleteOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : isTargetOwner ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Owner
                          </span>
                        ) : isTargetSuperAdmin ? (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                            Superadmin
                          </span>
                        ) : isSelf ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => { await logout(); window.location.href = "/"; }}
                            aria-label={`Sign out ${u.name ?? u.email}`}
                          >
                            <LogOut className="mr-1 h-3.5 w-3.5" />
                            Sign out
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((u) => {
                const isSelf = me?._id === u._id
                const isTargetOwner = u.role === "owner"
                const isTargetSuperAdmin = u.role === "superadmin"
                const canManage = !isSelf && !isTargetOwner && !isTargetSuperAdmin && canManageUsers
                const isSuspended = u.status === "suspended"
                return (
                  <div
                    key={u._id}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-border/70 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated",
                      isSuspended && "opacity-70"
                    )}
                  >
                    {isSelf && (
                      <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        You
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-white">
                        {u.avatar && <AvatarImage src={u.avatar} alt={u.name ?? u.email} />}
                        <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary text-sm font-bold text-white">
                          {initials(u.name, u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{u.name ?? "—"}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold", ROLE_COLORS[u.role])}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                          isSuspended
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", isSuspended ? "bg-red-500" : "bg-emerald-500")} />
                        {isSuspended ? "Suspended" : "Active"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Joined {fmtDate(u.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        <span className="font-semibold tabular-nums text-foreground">{u.loginCount ?? 0}</span>
                        <span>logins</span>
                      </span>
                    </div>
                    {(canManage || isSelf) && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
                        {canManage ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                              aria-label={`Actions for ${u.name ?? u.email}`}
                            >
                              <MoreVertical className="h-3.5 w-3.5" /> Manage
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <div className="px-2 py-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Change Role</p>
                              </div>
                              {(["admin", "editor", "viewer"] as const).map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => changeRole(u._id, role)}
                                  disabled={u.role === role}
                                >
                                  <span className={cn("mr-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold", ROLE_COLORS[role])}>
                                    {ROLE_LABELS[role]}
                                  </span>
                                  {u.role === role && <CheckCircle className="ml-auto h-3.5 w-3.5" />}
                                </DropdownMenuItem>
                              ))}
                              {isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Superadmin Actions</p>
                                  </div>
                                  <DropdownMenuItem
                                    onClick={() => changeRole(u._id, "superadmin")}
                                    disabled={u.role === "superadmin"}
                                  >
                                    <span className={cn("mr-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold", ROLE_COLORS.superadmin)}>
                                      Superadmin
                                    </span>
                                    {u.role === "superadmin" && <CheckCircle className="ml-auto h-3.5 w-3.5" />}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {isSuperAdmin && !isTargetOwner && !isTargetSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  {isSuspended ? (
                                    <DropdownMenuItem onClick={() => handleActivate(u._id)}>
                                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                      Activate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleSuspend(u._id)}>
                                      <Ban className="mr-2 h-4 w-4 text-orange-600" />
                                      Suspend
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeleteTarget(u._id)
                                      setDeleteOpen(true)
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : isSelf ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => { await logout(); window.location.href = "/" }}
                            aria-label={`Sign out ${u.name ?? u.email}`}
                          >
                            <LogOut className="h-3.5 w-3.5" /> Sign out
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <EmptyState
              icon={<Shield className="h-12 w-12" />}
              title="No users found"
              description={
                search
                  ? "Try a different search."
                  : "Invite your first team member to get started."
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(safePage - 1) * perPage + 1}</span> to{" "}
            <span className="font-semibold text-foreground">{Math.min(safePage * perPage, filtered.length)}</span> of{" "}
            <span className="font-semibold text-foreground">{filtered.length}</span> users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <UserPlus className="h-4 w-4" />
              </span>
              Invite User
            </DialogTitle>
            <DialogDescription>
              Send an invitation to join the admin panel. They will receive a branded email with a link to sign up. The invitation expires in 3 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "editor" | "viewer")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator - Full access</SelectItem>
                  <SelectItem value="editor">Editor - Manage content</SelectItem>
                  <SelectItem value="viewer">Viewer - Read only</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2 rounded-lg border border-border/60 bg-surface px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: roleDotColor(inviteRole) }}
                  />
                  <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold", ROLE_COLORS[inviteRole])}>
                    {ROLE_LABELS[inviteRole]}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[inviteRole]}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} className="gradient-gold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105">
              <UserPlus className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => { if (!open && !deleting) setDeleteOpen(false) }}
        title="Delete this user?"
        description="This action cannot be undone. The user will be permanently removed from the system and lose access immediately. Any pending invitations from this user will be revoked."
        confirmLabel="Delete user"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
