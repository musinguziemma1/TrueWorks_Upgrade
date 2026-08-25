"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { LogOut, Shield, Calendar, Mail, User, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  const { user } = useAuth();
  const { logout } = useAuth();
  const me = useQuery(api.users.current);
  const updateUser = useMutation(api.users.update);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    newReviews: true,
    marketing: false,
  });

  function initials(name?: string, email?: string) {
    const src = (name || email || "?").trim();
    const parts = src.split(/\s+|@/).filter(Boolean);
    return (parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")) || "?";
  }

  const handleSave = async () => {
    if (!me) return;
    setSaving(true);
    try {
      await updateUser({ id: me._id, name: name.trim() || me.name });
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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
                {user?.avatar && (
                  <AvatarImage src={user.avatar} alt={user.name ?? ""} />
                )}
                <AvatarFallback className="bg-[#0B2545] text-2xl font-bold text-white">
                  {initials(user?.name ?? undefined, user?.email ?? undefined)}
                </AvatarFallback>
              </Avatar>
              {editing ? (
                <div className="mt-4 w-full space-y-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={user?.name ?? "Your name"}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    {user?.name ?? "Admin"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {user?.email ?? "—"}
                  </p>
                  {me && (
                    <Badge variant="outline" className={`mt-3 ${roleColors[me.role] ?? ""}`}>
                      {roleLabels[me.role] ?? me.role}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setName(user?.name ?? "");
                      setEditing(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={async () => { await logout(); window.location.href = "/"; }}
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
              <CardDescription>Your TrueWorks account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium">{user?.name ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user?.email ?? "—"}</p>
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
                  <p className="text-sm font-medium">Signed in as {user?.email ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Account ID: {user?._id?.slice(0, 20)}...</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => { await logout(); window.location.href = "/"; }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "orderUpdates" as const, label: "Order Updates", desc: "Get notified about new orders and status changes" },
                { key: "newReviews" as const, label: "New Reviews", desc: "Get notified when customers leave reviews" },
                { key: "marketing" as const, label: "Marketing", desc: "Receive marketing tips and product updates" },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between py-2">
                  <div>
                    <Label>{pref.label}</Label>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[pref.key]}
                    onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [pref.key]: v }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
