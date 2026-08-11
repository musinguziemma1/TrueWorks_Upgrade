"use client"

import { useRef } from "react"
import { Image as ImageIcon, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { SettingsField } from "./settings-field"
import { SETTING_BY_KEY } from "@convex/settingsSchema"
import type { SettingsForm } from "../use-settings-form"

interface GeneralTabProps {
  form: SettingsForm
  uploading: string | null
  onUpload: (file: File, folder: string, settingKey: string) => void
}

export function GeneralTab({ form, uploading, onUpload }: GeneralTabProps) {
  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  const textFields = ["siteName", "siteTagline"]
  const textareaField = SETTING_BY_KEY.siteDescription
  const urlField = SETTING_BY_KEY.siteUrl
  const currencyField = SETTING_BY_KEY.currency

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
          <CardDescription>Core identity and metadata shown across the storefront.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {textFields.map((key) => {
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
          <SettingsField
            field={textareaField}
            value={form.values.siteDescription ?? textareaField.default}
            error={form.errors.siteDescription}
            onChange={(v) => form.setValue("siteDescription", v)}
          />
          <SettingsField
            field={urlField}
            value={form.values.siteUrl ?? urlField.default}
            error={form.errors.siteUrl}
            onChange={(v) => form.setValue("siteUrl", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo & Favicon</CardTitle>
          <CardDescription>Brand assets displayed in the header and browser tab.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Site Logo</Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => logoRef.current?.click()}
              >
                {uploading === "Logos" ? (
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mx-auto mb-2" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                )}
                <p className="text-sm text-muted-foreground">Upload logo (PNG, SVG, max 2MB)</p>
                {form.values.siteLogo && (
                  <img
                    src={String(form.values.siteLogo)}
                    alt="Current logo"
                    className="mx-auto mt-3 h-10 w-auto object-contain rounded border border-border"
                  />
                )}
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onUpload(file, "Logos", "siteLogo")
                  e.target.value = ""
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Favicon</Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => faviconRef.current?.click()}
              >
                {uploading === "Favicons" ? (
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mx-auto mb-2" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                )}
                <p className="text-sm text-muted-foreground">Upload favicon (32x32px ICO/PNG)</p>
                {form.values.siteFavicon && (
                  <img
                    src={String(form.values.siteFavicon)}
                    alt="Current favicon"
                    className="mx-auto mt-3 h-8 w-8 object-contain rounded border border-border"
                  />
                )}
              </div>
              <input
                ref={faviconRef}
                type="file"
                accept="image/x-icon,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onUpload(file, "Favicons", "siteFavicon")
                  e.target.value = ""
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Localization</CardTitle>
          <CardDescription>Regional preferences applied across the storefront.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-sm">
          <SettingsField
            field={currencyField}
            value={form.values.currency ?? currencyField.default}
            error={form.errors.currency}
            onChange={(v) => form.setValue("currency", v)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
