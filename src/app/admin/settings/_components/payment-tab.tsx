"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsField } from "./settings-field"
import { Badge } from "@/components/ui/badge"
import { SETTING_BY_KEY } from "@convex/settingsSchema"
import type { SettingsForm } from "../use-settings-form"

const gatewayKeys = ["pesapalEnabled", "stripeEnabled", "mtnMomoEnabled", "airtelMoneyEnabled", "paypalEnabled"]
const configKeys = ["currency", "taxRate"]
const modeKey = "pesapalMode"

export function PaymentTab({ form }: { form: SettingsForm }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateways</CardTitle>
          <CardDescription>
            Enable the payment providers customers see at checkout. Gateways marked “Planned” are stored for future rollout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {gatewayKeys.map((key) => {
            const field = SETTING_BY_KEY[key]
            return (
              <div key={key} className="py-2 border-b border-border last:border-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{field.label}</span>
                    {field.status === "live" ? (
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                        Planned
                      </Badge>
                    )}
                  </div>
                </div>
                <SettingsField
                  field={{ ...field, label: "", description: undefined }}
                  value={form.values[key] ?? field.default}
                  error={form.errors[key]}
                  onChange={(v) => form.setValue(key, v)}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency & Tax</CardTitle>
          <CardDescription>Pricing and tax configuration for the storefront.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
          {configKeys.map((key) => {
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
          <SettingsField
            field={SETTING_BY_KEY[modeKey]}
            value={form.values.pesapalMode ?? SETTING_BY_KEY[modeKey].default}
            error={form.errors.pesapalMode}
            onChange={(v) => form.setValue("pesapalMode", v)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
