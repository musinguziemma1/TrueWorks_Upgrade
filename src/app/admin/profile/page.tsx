"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth/provider"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  LogOut,
  Shield,
  Calendar,
  Mail,
  User,
  Edit,
  Loader2,
  Camera,
  KeyRound,
  Bell,
  Clock,
  CheckCircle2,
  ArrowRight,
  Settings,
  Activity,
} from "lucide-react"
import { toast } from "sonner"
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
  owner: "bg-amber-50/80 text-amber-600",
  admin: "bg-violet-50/80 text-violet-600",
  editor: "bg-blue-50/80 text-blue-600",
  viewer: "bg-muted/50 text-muted-foreground",
}

const TAB_ITEMS = [
  { value: "overview", label: "Overview", icon: User },
  { value: "security", label: "Security", icon: Shield },
  { value: "notifications", label: "Notifications", icon: Bell },
] as const

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
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "?"
    )
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
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#0F3058] px-6 py-8 lg:px-8 lg:py-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
              <a href="/admin" className="transition-colors hover:text-white/80">
                Dashboard
              </a>
              <ArrowRight className="h-3 w-3" />
              <span className="text-white/70">Profile</span>
            </nav>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </section>

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
                      {initials(
                        user?.name ?? undefined,
                        user?.email ?? undefined
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Change avatar"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
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
                    <Label
                      htmlFor="name-input"
                      className="text-xs text-muted-foreground"
                    >
                      Display Name
                    </Label>
                    <Input
                      id="name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={user?.name ?? "Your name"}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      className="flex-1"
                    >
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
                    <span
                      className={cn(
                        "mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        roleColors[me.role] ?? ""
                      )}
                    >
                      {roleLabels[me.role] ?? me.role}
                    </span>
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
            <div className="rounded-2xl border border-border/70 bg-white p-1 shadow-card">
              <TabsList className="h-auto gap-1 bg-transparent p-0">
                {TAB_ITEMS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
                      <User className="h-4 w-4" />
                    </span>
                    <CardTitle>Account Details</CardTitle>
                  </div>
                  <CardDescription>
                    Your TrueWorks account information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        icon: User,
                        label: "Full Name",
                        value: user?.name ?? "—",
                        tint: "text-primary bg-primary/5",
                      },
                      {
                        icon: Mail,
                        label: "Email",
                        value: user?.email ?? "—",
                        tint: "text-blue-600 bg-blue-50/80",
                      },
                      {
                        icon: Shield,
                        label: "Role",
                        value:
                          roleLabels[me?.role ?? ""] ?? me?.role ?? "—",
                        tint: "text-violet-600 bg-violet-50/80",
                      },
                      {
                        icon: Calendar,
                        label: "Joined",
                        value: me ? fmtDate(me.createdAt) : "—",
                        tint: "text-amber-600 bg-amber-50/80",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface p-4"
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            item.tint
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
                      <Activity className="h-4 w-4" />
                    </span>
                    <CardTitle>Activity</CardTitle>
                  </div>
                  <CardDescription>Your login history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-600 bg-emerald-50/80">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Total Logins
                          </p>
                          <p className="text-xs text-muted-foreground">
                            All time
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold tabular-nums text-foreground">
                        {me?.loginCount ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-600 bg-blue-50/80">
                          <Clock className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Last Login
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Most recent session
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {me?.lastLoginAt ? fmtDate(me.lastLoginAt) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-600 bg-emerald-50/80">
                          <Shield className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Account Status
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Current state
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          me?.status === "suspended"
                            ? "bg-red-50/80 text-red-600"
                            : "bg-emerald-50/80 text-emerald-600"
                        )}
                      >
                        {me?.status === "suspended" ? "Suspended" : "Active"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <CardTitle>Session</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your current session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary bg-primary/5">
                        <KeyRound className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Signed in as {user?.email ?? "—"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          ID: {user?._id?.slice(0, 20)}...
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-1.5 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/5 text-primary">
                      <Bell className="h-4 w-4" />
                    </span>
                    <CardTitle>Notification Preferences</CardTitle>
                  </div>
                  <CardDescription>
                    Choose what notifications you receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {[
                    {
                      key: "orderUpdates" as const,
                      label: "Order Updates",
                      desc: "Get notified about new orders and status changes",
                      icon: CheckCircle2,
                      tint: "text-emerald-600 bg-emerald-50/80",
                    },
                    {
                      key: "newReviews" as const,
                      label: "New Reviews",
                      desc: "Get notified when customers leave reviews",
                      icon: Mail,
                      tint: "text-blue-600 bg-blue-50/80",
                    },
                    {
                      key: "marketing" as const,
                      label: "Marketing",
                      desc: "Receive marketing tips and product updates",
                      icon: Bell,
                      tint: "text-amber-600 bg-amber-50/80",
                    },
                  ].map((pref) => (
                    <div
                      key={pref.key}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-surface p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            pref.tint
                          )}
                        >
                          <pref.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {pref.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pref.desc}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications[pref.key]}
                        onCheckedChange={(v) =>
                          setNotifications((prev) => ({
                            ...prev,
                            [pref.key]: v,
                          }))
                        }
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
