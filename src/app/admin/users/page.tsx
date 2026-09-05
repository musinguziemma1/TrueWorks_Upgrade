"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@/lib/auth/provider";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Shield, Search, UserPlus, Trash2, Ban, CheckCircle, LogOut, MoreVertical, Mail, Clock, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
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
      <AdminPageHeader
        title="Users & Roles"
        description="Manage who can access the admin panel"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Users & Roles" },
        ]}
        action={
          canManageUsers ? (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          ) : undefined
        }
      />

      {/* Role Legend */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div key={role} className="rounded-lg border p-3">
            <Badge variant="outline" className={`mb-1.5 ${ROLE_COLORS[role]}`}>
              {label}
            </Badge>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        ))}
      </div>

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
                      <Badge variant="outline" className={ROLE_COLORS[inv.role]}>
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </Badge>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          className="pl-10"
          aria-label="Search users"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading...</p>
          ) : (
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
                    <TableRow key={u._id} className={isSuspended ? "opacity-60" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {u.avatar && (
                              <AvatarImage src={u.avatar} alt={u.name ?? u.email} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {initials(u.name, u.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                            {isSelf && (
                              <Badge variant="outline" className="mt-0.5 text-[10px]">You</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ROLE_COLORS[u.role]}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isSuspended
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }
                        >
                          {isSuspended ? "Suspended" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {u.loginCount ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
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
                                  <Badge variant="outline" className={`mr-2 text-[10px] ${ROLE_COLORS[role]}`}>
                                    {ROLE_LABELS[role]}
                                  </Badge>
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
                                    <Badge variant="outline" className={`mr-2 text-[10px] ${ROLE_COLORS.superadmin}`}>
                                      Superadmin
                                    </Badge>
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
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                            Owner
                          </Badge>
                        ) : isTargetSuperAdmin ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-[10px]">
                            Superadmin
                          </Badge>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} users - Page {safePage} of {totalPages}
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
            <DialogTitle>Invite User</DialogTitle>
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
              <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[inviteRole]}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>
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
