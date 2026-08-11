"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { HardDrive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsField } from "./settings-field"
import { SETTING_BY_KEY } from "@convex/settingsSchema"
import type { SettingsForm } from "../use-settings-form"

const downloadKeys = ["maxDownloadsPerPurchase", "downloadLinkExpiryDays", "downloadMethod", "requireLoginToDownload", "downloadNotifications"]
const storageKeys = ["storageProvider", "storageMax"]

export function DownloadsTab({ form }: { form: SettingsForm }) {
  const mediaFiles = useQuery(api.storage.listFiles, {})

  const totalStorageBytes = mediaFiles?.reduce((sum, f) => sum + (f.size ?? 0), 0) ?? 0
  const totalStorageGB = +(totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)
  const storageMax = Number(form.values.storageMax ?? 10)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Download Settings</CardTitle>
          <CardDescription>How purchased files are delivered to customers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {downloadKeys.map((key) => {
              const field = SETTING_BY_KEY[key]
              return (
                <SettingsField
                  key={key}
                  field={field}
                  value={form.values[key] ?? field.default}
                  error={form.errors[key]}
                  onChange={(v) => form.setValue(key, v)}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>Media files hosted for products and storefront assets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {storageKeys.map((key) => {
              const field = SETTING_BY_KEY[key]
              return (
                <SettingsField
                  key={key}
                  field={field}
                  value={form.values[key] ?? field.default}
                  error={form.errors[key]}
                  onChange={(v) => form.setValue(key, v)}
                />
              )
            })}
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                Storage Used
              </span>
              <span className="text-muted-foreground">{totalStorageGB} GB / {storageMax} GB</span>
            </div>
            <div className="h-2.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${storageMax > 0 ? Math.min(100, (totalStorageGB / storageMax) * 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{mediaFiles?.length ?? 0} files stored</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
