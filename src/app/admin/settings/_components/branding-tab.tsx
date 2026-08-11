"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsField } from "./settings-field"
import { BrandingPreview } from "./branding-preview"
import { SETTING_BY_KEY } from "@convex/settingsSchema"
import type { SettingsForm } from "../use-settings-form"

const colorKeys = [
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "backgroundColor",
  "surfaceColor",
  "foregroundColor",
]

const fontKeys = ["headingFont", "bodyFont"]

export function BrandingTab({ form }: { form: SettingsForm }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>See how your branding choices render before you save.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingPreview values={form.values} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme Colors</CardTitle>
          <CardDescription>Primary and accent colors used across the storefront.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {colorKeys.map((key) => {
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Font families applied to headings and body text.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fontKeys.map((key) => {
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom CSS</CardTitle>
          <CardDescription>Advanced styling rules injected into the storefront. Scripts and imports are stripped.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsField
            field={SETTING_BY_KEY.customCss}
            value={form.values.customCss ?? ""}
            error={form.errors.customCss}
            onChange={(v) => form.setValue("customCss", v)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
