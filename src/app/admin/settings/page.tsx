"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings, Palette, Mail, CreditCard, Download, Shield, Image, Key, Loader2 } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"

interface SettingsState {
  siteName: string
  siteTagline: string
  siteDescription: string
  siteUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  foregroundColor: string
  headingFont: string
  bodyFont: string
  customCss: string
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpFrom: string
  currency: string
  taxRate: number
  pesapalEnabled: boolean
  maxDownloadsPerPurchase: number
  downloadLinkExpiryDays: number
  downloadMethod: string
  requireLoginToDownload: boolean
  downloadNotifications: boolean
  storageProvider: string
  storageUsed: number
  storageMax: number
  require2fa: boolean
  passwordExpiryDays: number
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  apiRateLimiting: boolean
  ipWhitelist: boolean
}

const defaultSettings: SettingsState = {
  siteName: "",
  siteTagline: "",
  siteDescription: "",
  siteUrl: "",
  primaryColor: "#0B2545",
  secondaryColor: "#4A6FA5",
  accentColor: "#C9A227",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#F2F5F9",
  foregroundColor: "#1E293B",
  headingFont: "georgia",
  bodyFont: "calibri",
  customCss: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUsername: "",
  smtpFrom: "",
  currency: "UGX",
  taxRate: 18,
  pesapalEnabled: true,
  maxDownloadsPerPurchase: 5,
  downloadLinkExpiryDays: 30,
  downloadMethod: "direct",
  requireLoginToDownload: true,
  downloadNotifications: true,
  storageProvider: "local",
  storageUsed: 0,
  storageMax: 10,
  require2fa: false,
  passwordExpiryDays: 90,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  apiRateLimiting: true,
  ipWhitelist: false,
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const rawSettings = useQuery(api.settings.getAll)
  const setMultiple = useMutation(api.settings.setMultiple)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)

  const initFromDb = useCallback((dbData: Record<string, unknown>) => {
    const merged = { ...defaultSettings }
    for (const [key, value] of Object.entries(dbData)) {
      if (key in merged) {
        ;(merged as Record<string, unknown>)[key] = value
      }
    }
    setSettings(merged)
  }, [])

  useEffect(() => {
    if (rawSettings) {
      initFromDb(rawSettings)
    }
  }, [rawSettings, initFromDb])

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateSelect = <K extends keyof SettingsState>(key: K, value: string | null) => {
    if (value !== null) setSettings((prev) => ({ ...prev, [key]: value as SettingsState[K] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const entries: { key: string; value: unknown }[] = Object.entries(settings)
        .filter(([key, value]) => {
          const dbVal = rawSettings?.[key]
          return dbVal === undefined || value !== dbVal
        })
        .map(([key, value]) => ({ key, value }))

      if (entries.length === 0) {
        toast.info("No changes to save")
        return
      }

      await setMultiple({ settings: entries })
      toast.success("Settings saved successfully")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (rawSettings) {
      initFromDb(rawSettings)
    }
    toast.info("Changes discarded")
  }

  const colorKeys = [
    { label: "Primary Color", key: "primaryColor" as const, default: "#0B2545" },
    { label: "Secondary Color", key: "secondaryColor" as const, default: "#4A6FA5" },
    { label: "Accent Color", key: "accentColor" as const, default: "#C9A227" },
    { label: "Background", key: "backgroundColor" as const, default: "#FFFFFF" },
    { label: "Surface Color", key: "surfaceColor" as const, default: "#F2F5F9" },
    { label: "Foreground", key: "foregroundColor" as const, default: "#1E293B" },
  ]

  if (!rawSettings) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Settings"
          description="Manage your store preferences, integrations, and security."
          breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]}
        />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Manage your store preferences, integrations, and security."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]}
      />

      <Tabs defaultValue="general">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="general"><Settings className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="h-4 w-4" /> Branding</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4" /> Email</TabsTrigger>
          <TabsTrigger value="payment"><CreditCard className="h-4 w-4" /> Payment</TabsTrigger>
          <TabsTrigger value="downloads"><Download className="h-4 w-4" /> Downloads</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4" /> Security</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          <TabsContent value="general" className="space-y-6">
            <SectionCard title="Site Information">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input value={settings.siteName} onChange={(e) => update("siteName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input value={settings.siteTagline} onChange={(e) => update("siteTagline", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={settings.siteDescription} onChange={(e) => update("siteDescription", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Site URL</Label>
                  <Input value={settings.siteUrl} onChange={(e) => update("siteUrl", e.target.value)} placeholder="https://trueworks.com" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Logo & Favicon">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Site Logo</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Image className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Upload logo (PNG, SVG, max 2MB)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Image className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Upload favicon (32x32px ICO/PNG)</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Localization">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={settings.currency} onValueChange={(v) => updateSelect("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UGX">UGX (Ugandan Shilling)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <SectionCard title="Theme Colors">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorKeys.map((color) => (
                  <div key={color.label} className="space-y-2">
                    <Label>{color.label}</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md border border-border shrink-0" style={{ backgroundColor: settings[color.key] }} />
                      <Input value={settings[color.key]} onChange={(e) => update(color.key, e.target.value)} className="font-mono" />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Typography">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select value={settings.headingFont} onValueChange={(v) => updateSelect("headingFont", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="georgia">Georgia, Times New Roman, serif</SelectItem>
                      <SelectItem value="inter">Inter, sans-serif</SelectItem>
                      <SelectItem value="playfair">Playfair Display, serif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select value={settings.bodyFont} onValueChange={(v) => updateSelect("bodyFont", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calibri">Calibri, Source Sans 3, system-ui, sans-serif</SelectItem>
                      <SelectItem value="inter">Inter, sans-serif</SelectItem>
                      <SelectItem value="opensans">Open Sans, sans-serif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Custom CSS">
              <Textarea placeholder="Enter custom CSS rules..." className="min-h-[150px] font-mono text-xs" value={settings.customCss} onChange={(e) => update("customCss", e.target.value)} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <SectionCard title="SMTP Configuration">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={settings.smtpHost} onChange={(e) => update("smtpHost", e.target.value)} placeholder="smtp.trueworks.com" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input type="number" value={settings.smtpPort} onChange={(e) => update("smtpPort", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={settings.smtpUsername} onChange={(e) => update("smtpUsername", e.target.value)} placeholder="noreply@trueworks.com" />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input value={settings.smtpFrom} onChange={(e) => update("smtpFrom", e.target.value)} placeholder="noreply@trueworks.com" />
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4">Test Connection</Button>
            </SectionCard>

            <SectionCard title="Email Templates">
              <div className="space-y-3">
                {["Order Confirmation", "Payment Receipt", "Download Link", "Password Reset", "Welcome Email", "Newsletter"].map((t) => (
                  <div key={t} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm">{t}</span>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <SectionCard title="Payment Gateways">
              <div className="space-y-4">
                {[
                  { name: "MTN MoMo", enabled: true },
                  { name: "Airtel Money", enabled: true },
                  { name: "Stripe (Card)", enabled: true },
                  { name: "PayPal", enabled: false },
                ].map((gateway) => (
                  <div key={gateway.name} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{gateway.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm">Configure</Button>
                      <Switch defaultChecked={gateway.enabled} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Currency & Tax">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={settings.currency} onValueChange={(v) => updateSelect("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UGX">UGX (Ugandan Shilling)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" value={settings.taxRate} onChange={(e) => update("taxRate", Number(e.target.value))} />
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="downloads" className="space-y-6">
            <SectionCard title="Download Settings">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Downloads Per Purchase</Label>
                    <Input type="number" value={settings.maxDownloadsPerPurchase} onChange={(e) => update("maxDownloadsPerPurchase", Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Download Link Expiry (days)</Label>
                    <Input type="number" value={settings.downloadLinkExpiryDays} onChange={(e) => update("downloadLinkExpiryDays", Number(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Download Method</Label>
                  <Select value={settings.downloadMethod} onValueChange={(v) => updateSelect("downloadMethod", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct Download</SelectItem>
                      <SelectItem value="signed">Signed URL (S3)</SelectItem>
                      <SelectItem value="token">Token-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Login to Download</Label>
                    <p className="text-xs text-muted-foreground">Users must be logged in to download purchased files</p>
                  </div>
                  <Switch checked={settings.requireLoginToDownload} onCheckedChange={(v) => update("requireLoginToDownload", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Download Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send email when a download is available</p>
                  </div>
                  <Switch checked={settings.downloadNotifications} onCheckedChange={(v) => update("downloadNotifications", v)} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Storage">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Storage Provider</Label>
                  <Select value={settings.storageProvider} onValueChange={(v) => updateSelect("storageProvider", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="s3">AWS S3</SelectItem>
                      <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                      <SelectItem value="do">DigitalOcean Spaces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Storage Used</span>
                    <span className="text-muted-foreground">{settings.storageUsed} GB / {settings.storageMax} GB</span>
                  </div>
                  <div className="h-2.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${settings.storageMax > 0 ? (settings.storageUsed / settings.storageMax) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SectionCard title="Authentication">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication (2FA)</Label>
                    <p className="text-xs text-muted-foreground">Require 2FA for admin account access</p>
                  </div>
                  <Switch checked={settings.require2fa} onCheckedChange={(v) => update("require2fa", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Password Expiry</Label>
                    <p className="text-xs text-muted-foreground">Force password change every {settings.passwordExpiryDays} days</p>
                  </div>
                  <Switch checked={settings.passwordExpiryDays > 0} onCheckedChange={(v) => update("passwordExpiryDays", v ? 90 : 0)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input type="number" value={settings.sessionTimeoutMinutes} onChange={(e) => update("sessionTimeoutMinutes", Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input type="number" value={settings.maxLoginAttempts} onChange={(e) => update("maxLoginAttempts", Number(e.target.value))} />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Session Management">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No active sessions tracked</p>
              </div>
              <Button variant="outline" size="sm" className="mt-4 text-destructive border-destructive hover:bg-destructive hover:text-white">Revoke All Sessions</Button>
            </SectionCard>

            <SectionCard title="API Security">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>API Rate Limiting</Label>
                    <p className="text-xs text-muted-foreground">Limit API requests to prevent abuse</p>
                  </div>
                  <Switch checked={settings.apiRateLimiting} onCheckedChange={(v) => update("apiRateLimiting", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>IP Whitelist</Label>
                    <p className="text-xs text-muted-foreground">Restrict admin access to specific IPs</p>
                  </div>
                  <Switch checked={settings.ipWhitelist} onCheckedChange={(v) => update("ipWhitelist", v)} />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input value="Not configured" readOnly className="font-mono" />
                    <Button variant="outline" size="sm"><Key className="h-4 w-4" /> Regenerate</Button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
