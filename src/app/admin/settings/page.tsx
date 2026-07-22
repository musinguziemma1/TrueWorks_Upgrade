"use client"

import { useState } from "react"
import { Settings, Palette, Mail, CreditCard, Download, Shield, Image, Key } from "lucide-react"
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
                  <Input defaultValue="TrueWorks Limited" />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input defaultValue="Digital Products Marketplace" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea defaultValue="Your premier destination for high-quality digital products, templates, and tools." />
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
                  <Select defaultValue="UGX">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UGX">UGX (Ugandan Shilling)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="Kampala">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kampala">Africa/Kampala (UTC+3)</SelectItem>
                      <SelectItem value="Nairobi">Africa/Nairobi (UTC+3)</SelectItem>
                      <SelectItem value="UTC">UTC+0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <SectionCard title="Theme Colors">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Primary Color", value: "#0B2545" },
                  { label: "Secondary Color", value: "#4A6FA5" },
                  { label: "Accent Color", value: "#C9A227" },
                  { label: "Background", value: "#FFFFFF" },
                  { label: "Surface Color", value: "#F2F5F9" },
                  { label: "Foreground", value: "#1E293B" },
                ].map((color) => (
                  <div key={color.label} className="space-y-2">
                    <Label>{color.label}</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md border border-border shrink-0" style={{ backgroundColor: color.value }} />
                      <Input defaultValue={color.value} className="font-mono" />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Typography">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select defaultValue="georgia">
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
                  <Select defaultValue="calibri">
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
              <Textarea placeholder="Enter custom CSS rules..." className="min-h-[150px] font-mono text-xs" />
            </SectionCard>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <SectionCard title="SMTP Configuration">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>SMTP Host</Label><Input defaultValue="smtp.trueworks.com" /></div>
                <div className="space-y-2"><Label>SMTP Port</Label><Input type="number" defaultValue="587" /></div>
                <div className="space-y-2"><Label>Username</Label><Input defaultValue="noreply@trueworks.com" /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" defaultValue="********" /></div>
                <div className="space-y-2">
                  <Label>Encryption</Label>
                  <Select defaultValue="TLS">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TLS">TLS</SelectItem>
                      <SelectItem value="SSL">SSL</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>From Email</Label><Input defaultValue="noreply@trueworks.com" /></div>
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
                  <Select defaultValue="UGX">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UGX">UGX (Ugandan Shilling)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" defaultValue="18" />
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="downloads" className="space-y-6">
            <SectionCard title="Download Settings">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Max Downloads Per Purchase</Label><Input type="number" defaultValue="5" /></div>
                  <div className="space-y-2"><Label>Download Link Expiry (days)</Label><Input type="number" defaultValue="30" /></div>
                </div>
                <div className="space-y-2">
                  <Label>Download Method</Label>
                  <Select defaultValue="direct">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct Download</SelectItem>
                      <SelectItem value="signed">Signed URL (S3)</SelectItem>
                      <SelectItem value="token">Token-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Require Login to Download</Label><p className="text-xs text-muted-foreground">Users must be logged in to download purchased files</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Enable Download Notifications</Label><p className="text-xs text-muted-foreground">Send email when a download is available</p></div>
                  <Switch defaultChecked />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Storage">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Storage Provider</Label>
                  <Select defaultValue="local">
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
                    <span className="text-muted-foreground">2.4 GB / 10 GB</span>
                  </div>
                  <div className="h-2.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: "24%" }} />
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SectionCard title="Authentication">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>Two-Factor Authentication (2FA)</Label><p className="text-xs text-muted-foreground">Require 2FA for admin account access</p></div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Password Expiry</Label><p className="text-xs text-muted-foreground">Force password change every 90 days</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Session Timeout (minutes)</Label><Input type="number" defaultValue="60" /></div>
                  <div className="space-y-2"><Label>Max Login Attempts</Label><Input type="number" defaultValue="5" /></div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Session Management">
              <div className="space-y-3">
                {[
                  { device: "Chrome on Windows", lastActive: "5 minutes ago", ip: "192.168.1.1" },
                  { device: "Safari on macOS", lastActive: "2 hours ago", ip: "192.168.1.2" },
                  { device: "Chrome on Android", lastActive: "1 day ago", ip: "192.168.1.3" },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <span className="text-sm">{session.device}</span>
                      <p className="text-xs text-muted-foreground">{session.lastActive} &middot; {session.ip}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive">Revoke</Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4 text-destructive border-destructive hover:bg-destructive hover:text-white">Revoke All Sessions</Button>
            </SectionCard>

            <SectionCard title="API Security">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>API Rate Limiting</Label><p className="text-xs text-muted-foreground">Limit API requests to prevent abuse</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>IP Whitelist</Label><p className="text-xs text-muted-foreground">Restrict admin access to specific IPs</p></div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input defaultValue="tw_sk_live_xxxxxxxxxxxx" readOnly className="font-mono" />
                    <Button variant="outline" size="sm"><Key className="h-4 w-4" /> Regenerate</Button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}
