"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogOut, Shield, Calendar, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/layout/admin-page-header";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800 border-amber-200",
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  editor: "bg-blue-100 text-blue-800 border-blue-200",
  viewer: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function AdminProfilePage() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const me = useQuery(api.users.current);

  function initials(name?: string, email?: string) {
    const src = (name || email || "?").trim();
    const parts = src.split(/\s+|@/).filter(Boolean);
    return (parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")) || "?";
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My Profile"
        description="View and manage your account"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Profile" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                {user?.imageUrl && (
                  <AvatarImage src={user.imageUrl} alt={user.fullName ?? ""} />
                )}
                <AvatarFallback className="bg-[#0B2545] text-2xl font-bold text-white">
                  {initials(user?.fullName ?? undefined, user?.primaryEmailAddress?.emailAddress ?? undefined)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold text-foreground">
                {user?.fullName ?? user?.username ?? "Admin"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress ?? "—"}
              </p>
              {me && (
                <Badge variant="outline" className={`mt-3 ${roleColors[me.role] ?? ""}`}>
                  {roleLabels[me.role] ?? me.role}
                </Badge>
              )}
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your account information from Clerk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium">{user?.fullName ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user?.primaryEmailAddress?.emailAddress ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium">{roleLabels[me?.role ?? ""] ?? me?.role ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-sm font-medium">{me ? fmtDate(me.createdAt) : "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Your login history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Total Logins</span>
                <span className="text-sm font-semibold">{me?.loginCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Last Login</span>
                <span className="text-sm font-medium">
                  {me?.lastLoginAt ? fmtDate(me.lastLoginAt) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Account Status</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  {me?.status === "suspended" ? "Suspended" : "Active"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>Manage your current session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Signed in as {user?.primaryEmailAddress?.emailAddress}</p>
                  <p className="text-xs text-muted-foreground">Session ID: {user?.id?.slice(0, 20)}...</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => signOut({ redirectUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
