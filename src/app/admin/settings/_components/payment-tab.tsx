"use client";

import { useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsField } from "./settings-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SETTING_BY_KEY } from "@convex/settingsSchema";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  Calculator,
  Mail,
  ShieldCheck,
} from "lucide-react";
import type { SettingsForm } from "../use-settings-form";

const gatewayKeys = ["pesapalEnabled", "stripeEnabled", "mtnMomoEnabled", "airtelMoneyEnabled", "paypalEnabled"]
const gatewayEmailKeys: Record<string, string> = {
  pesapalEnabled: "pesapalEmail",
  stripeEnabled: "stripeEmail",
}

function GatewayRow({
  field,
  enabled,
  email,
  onToggle,
  onEmailChange,
}: {
  field: (typeof SETTING_BY_KEY)[string]
  enabled: boolean
  email: string
  onToggle: (v: boolean) => void
  onEmailChange: (v: string) => void
}) {
  const [showEmail, setShowEmail] = useState(false)
  const hasEmailKey = field.key in gatewayEmailKeys

  return (
    <div className={cn("rounded-xl border p-4 transition-all", enabled ? "border-emerald-200 bg-emerald-50/30" : "border-border bg-muted/20")}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={`Toggle ${field.label}`}
            onClick={() => onToggle(!enabled)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2",
              enabled ? "bg-emerald-500" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                enabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium", enabled ? "text-primary" : "text-muted-foreground")}>{field.label}</span>
              {field.status === "live" ? (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal text-emerald-600 border-emerald-200">
                  {enabled ? "Active" : "Inactive"}
                </Badge>
              ) : (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal text-amber-600 border-amber-200">
                  Planned
                </Badge>
              )}
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
            )}
          </div>
        </div>
        {hasEmailKey && enabled && field.status === "live" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowEmail(!showEmail)}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5 mr-1" />
            {showEmail ? "Hide" : "Email"}
          </Button>
        )}
      </div>
      {showEmail && hasEmailKey && (
        <div className="mt-3 pt-3 border-t border-border">
          <Label className="text-xs text-muted-foreground">Notification Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="payments@trueworks.com"
            className="mt-1 h-9 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Payment notifications for this gateway are sent here.</p>
        </div>
      )}
    </div>
  )
}

function TaxPreview({ form }: { form: SettingsForm }) {
  const calculateTax = useQuery(api.currency.calculateTax, {
    amount: 100,
    taxRate: Number(form.values.taxRate ?? 18),
    currency: String(form.values.currency ?? "USD"),
  })

  if (!calculateTax) return null

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">Tax Preview (on $100)</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-blue-700">Subtotal</p>
          <p className="text-sm font-semibold text-blue-900">${calculateTax.subtotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700">Tax ({calculateTax.taxRate}%)</p>
          <p className="text-sm font-semibold text-blue-900">${calculateTax.taxAmount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700">Total</p>
          <p className="text-sm font-semibold text-blue-900">${calculateTax.total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}

function CurrencyConverter({ form }: { form: SettingsForm }) {
  const getRates = useAction(api.currency.getExchangeRates)
  const [rates, setRates] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastFetched, setLastFetched] = useState<number | null>(null)
  const currency = String(form.values.currency ?? "USD")

  const fetchRates = async () => {
    setLoading(true)
    try {
      const result = await getRates({ base: currency })
      setRates(result.rates)
      setLastFetched(result.fetchedAt)
    } catch {
      toast.error("Failed to fetch exchange rates")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => { void fetchRates() }, 500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency])

  const displayCurrencies = ["USD", "UGX", "KES", "EUR", "GBP"]
  const currentRate = rates ? rates[currency] ?? 1 : 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium">Exchange Rates (vs {currency})</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={fetchRates}
          disabled={loading}
          className="text-xs"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {rates ? (
        <div className="grid grid-cols-5 gap-2">
          {displayCurrencies.map((c) => (
            <div
              key={c}
              className={cn(
                "rounded-lg border p-2 text-center",
                c === currency ? "border-amber-300 bg-amber-50" : "border-border bg-muted/30"
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">{c}</p>
              <p className="text-sm font-semibold text-primary">
                {(rates[c] / currentRate).toFixed(c === "UGX" || c === "KES" ? 0 : 2)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground mt-1">Loading rates...</p>
        </div>
      )}

      {lastFetched && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(lastFetched).toLocaleTimeString()}
        </p>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Rates auto-update hourly. Enable &quot;Auto-Convert Currency&quot; to apply live rates at checkout.
        </p>
      </div>
    </div>
  )
}

export function PaymentTab({ form }: { form: SettingsForm }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateways</CardTitle>
          <CardDescription>
            Enable payment providers and configure notification emails. Toggle to activate or deactivate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {gatewayKeys.map((key) => {
            const field = SETTING_BY_KEY[key]
            const emailKey = gatewayEmailKeys[key]
            return (
              <GatewayRow
                key={key}
                field={field}
                enabled={Boolean(form.values[key])}
                email={emailKey ? String(form.values[emailKey] ?? "") : ""}
                onToggle={(v) => form.setValue(key, v)}
                onEmailChange={(v) => {
                  if (emailKey) form.setValue(emailKey, v)
                }}
              />
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency & Tax</CardTitle>
          <CardDescription>Pricing, tax configuration, and live currency conversion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SettingsField
              field={SETTING_BY_KEY.currency}
              value={form.values.currency ?? SETTING_BY_KEY.currency.default}
              error={form.errors.currency}
              onChange={(v) => form.setValue("currency", v)}
            />
            <SettingsField
              field={SETTING_BY_KEY.taxRate}
              value={form.values.taxRate ?? SETTING_BY_KEY.taxRate.default}
              error={form.errors.taxRate}
              onChange={(v) => form.setValue("taxRate", v)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SettingsField
              field={SETTING_BY_KEY.taxAutoCalculate}
              value={form.values.taxAutoCalculate ?? SETTING_BY_KEY.taxAutoCalculate.default}
              error={form.errors.taxAutoCalculate}
              onChange={(v) => form.setValue("taxAutoCalculate", v)}
            />
            <SettingsField
              field={SETTING_BY_KEY.currencyAutoConvert}
              value={form.values.currencyAutoConvert ?? SETTING_BY_KEY.currencyAutoConvert.default}
              error={form.errors.currencyAutoConvert}
              onChange={(v) => form.setValue("currencyAutoConvert", v)}
            />
          </div>

          <TaxPreview form={form} />

          <CurrencyConverter form={form} />

          <SettingsField
            field={SETTING_BY_KEY.pesapalMode}
            value={form.values.pesapalMode ?? SETTING_BY_KEY.pesapalMode.default}
            error={form.errors.pesapalMode}
            onChange={(v) => form.setValue("pesapalMode", v)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
