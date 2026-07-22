"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Shield, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function RoleBadge({ role }: { role: "admin" | "customer" }) {
  return role === "admin" ? (
    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
      Admin
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
      Customer
    </Badge>
  );
}

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

export default function UsersPage() {
  const users = useQuery(api.users.list);
  const me = useQuery(api.users.current);
  const setRole = useMutation(api.users.setRole);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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

  async function changeRole(userId: Id<"users">, role: "admin" | "customer") {
    try {
      await setRole({ userId, role });
      toast.success(`Role updated to ${role}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
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
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Change role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((u) => {
                  const isSelf = me?._id === u._id;
                  return (
                    <TableRow key={u._id}>
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
                            {isSelf && (
                              <p className="text-xs text-muted-foreground">(you)</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            changeRole(u._id, v as "admin" | "customer")
                          }
                          disabled={isSelf}
                        >
                          <SelectTrigger className="ml-auto h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
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
                  : "Users will appear here after they sign up."
              }
            />
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} users · Page {safePage} of {totalPages}
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
    </div>
  );
}
