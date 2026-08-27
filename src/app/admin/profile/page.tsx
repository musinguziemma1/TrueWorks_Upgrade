"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth/provider"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LogOut, Shield, Calendar, Mail, User, Edit, Loader2, Camera,
  KeyRound, Bell, Clock, CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { cn } from "@/lib/utils"

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
}

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800 border-amber-200",
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  editor: "bg-blue-100 text-blue-800 border-blue-200",
  viewer: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function AdminProfilePage() {
  const { user, logout } = useAuth()
  const me = useQuery(api.users.current)
  const updateUser = useMutation(api.users.update)
  const uploadFile = useAction(api.storage.uploadFile)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    newReviews: true,
    marketing: false,
  })

  function initials(name?: string, email?: string) {
    const src = (name || email || "?").trim()
    const parts = src.split(/\s+|@/).filter(Boolean)
    return (parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")) || "?"
  }

  const handleSave = async () => {
    if (!me) return
    setSaving(true)
    try {
      await updateUser({ id: me._id, name: name.trim() || me.name })
      setEditing(false)
      toast.success("Profile updated")
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !me) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    setUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const result = await uploadFile({
        name: file.name,
        content: buffer,
        contentType: file.type,
      })
      await updateUser({ id: me._id, avatar: result.url })
      toast.success("Avatar updated")
    } catch {
      toast.error("Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }

  const handleSignOut = async () => {
    await logout()
    window.location.href = "/"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My Profile"
        description="Manage your account settings and preferences"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Profile" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1 lg:h-fit">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                  {user?.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name ?? ""} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-3xl font-bold text-white">
                      {initials(user?.name ?? undefined, user?.email ?? undefined)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Change avatar"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {editing ? (
                <div className="mt-5 w-full space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name-input" className="text-xs text-muted-foreground">Display Name</Label>
                    <Input
                      id="name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={user?.name ?? "Your name"}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="mt-5 text-xl font-semibold text-foreground">
                    {user?.name ?? "Admin"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {user?.email ?? "—"}
                  </p>
                  {me && (
                    <Badge variant="outline" className={cn("mt-3", roleColors[me.role] ?? "")}>
                      {roleLabels[me.role] ?? me.role}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => {
                      setName(user?.name ?? "")
                      setEditing(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </>
              )}

              <Separator className="my-5" />

              <Button
                variant="outline"
                className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview" className="gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Your TrueWorks account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { icon: User, label: "Full Name", value: user?.name ?? "—" },
                      { icon: Mail, label: "Email", value: user?.email ?? "—" },
                      { icon: Shield, label: "Role", value: roleLabels[me?.role ?? ""] ?? me?.role ?? "—" },
                      { icon: Calendar, label: "Joined", value: me ? fmtDate(me.createdAt) : "—" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity</CardTitle>
                  <CardDescription>Your login history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-50 p-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total Logins</p>
                          <p className="text-xs text-muted-foreground">All time</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold">{me?.loginCount ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 p-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Last Login</p>
                          <p className="text-xs text-muted-foreground">Most recent session</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {me?.lastLoginAt ? fmtDate(me.lastLoginAt) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-50 p-2">
                          <Shield className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Account Status</p>
                          <p className="text-xs text-muted-foreground">Current state</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {me?.status === "suspended" ? "Suspended" : "Active"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session</CardTitle>
                  <CardDescription>Manage your current session</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Signed in as {user?.email ?? "—"}</p>
                        <p className="text-xs text-muted-foreground font-mono">ID: {user?._id?.slice(0, 20)}...</p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-1.5" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what notifications you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {[
                    { key: "orderUpdates" as const, label: "Order Updates", desc: "Get notified about new orders and status changes", icon: CheckCircle2 },
                    { key: "newReviews" as const, label: "New Reviews", desc: "Get notified when customers leave reviews", icon: Mail },
                    { key: "marketing" as const, label: "Marketing", desc: "Receive marketing tips and product updates", icon: Bell },
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between rounded-xl p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <pref.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{pref.label}</p>
                          <p className="text-xs text-muted-foreground">{pref.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications[pref.key]}
                        onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [pref.key]: v }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
