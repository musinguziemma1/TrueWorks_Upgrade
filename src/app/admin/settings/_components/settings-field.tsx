"use client"

import type { SettingField } from "@convex/settingsSchema"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FieldProps {
  field: SettingField
  value: string | number | boolean
  error?: string
  onChange: (value: string | number | boolean) => void
  disabled?: boolean
}

function FieldLabel({ field }: { field: SettingField }) {
  return (
    <Label className="flex items-center gap-2 text-sm font-medium">
      {field.label}
      {field.status === "planned" && (
        <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
          Planned
        </Badge>
      )}
      {field.secret && (
        <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal text-amber-600 dark:text-amber-400">
          Secret
        </Badge>
      )}
    </Label>
  )
}

function FieldHint({ field }: { field: SettingField }) {
  return field.description ? (
    <p className="text-xs text-muted-foreground leading-relaxed">{field.description}</p>
  ) : null
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <p className="text-xs text-destructive font-medium">{error}</p>
}

export function SettingsField({ field, value, error, onChange, disabled }: FieldProps) {
  switch (field.type) {
    case "boolean":
      return (
        <div className="flex items-start justify-between gap-4 py-1">
          <div className="space-y-0.5">
            <FieldLabel field={field} />
            <FieldHint field={field} />
            <FieldError error={error} />
          </div>
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(Boolean(v))}
            disabled={disabled}
          />
        </div>
      )

    case "number":
      return (
        <div className="space-y-1.5">
          <FieldLabel field={field} />
          <FieldHint field={field} />
          <Input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={String(value)}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            aria-invalid={!!error}
          />
          <FieldError error={error} />
        </div>
      )

    case "select":
      return (
        <div className="space-y-1.5">
          <FieldLabel field={field} />
          <FieldHint field={field} />
          <Select value={String(value)} onValueChange={(v) => { if (v !== null) onChange(v) }} disabled={disabled}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError error={error} />
        </div>
      )

    case "color":
      return (
        <div className="space-y-1.5">
          <FieldLabel field={field} />
          <div className="flex items-center gap-2">
            <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border">
              <span className="absolute inset-0" style={{ backgroundColor: String(value) }} />
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(String(value)) ? String(value) : "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={disabled}
                aria-label={`${field.label} color picker`}
              />
            </label>
            <Input
              value={String(value)}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono"
              disabled={disabled}
              aria-invalid={!!error}
            />
          </div>
          <FieldError error={error} />
        </div>
      )

    case "textarea":
    case "css":
      return (
        <div className="space-y-1.5">
          <FieldLabel field={field} />
          <FieldHint field={field} />
          <Textarea
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(field.type === "css" && "min-h-[150px] font-mono text-xs")}
            disabled={disabled}
            aria-invalid={!!error}
          />
          <FieldError error={error} />
        </div>
      )

    default:
      return (
        <div className="space-y-1.5">
          <FieldLabel field={field} />
          <FieldHint field={field} />
          <Input
            type={field.type === "email" ? "email" : "text"}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            aria-invalid={!!error}
          />
          <FieldError error={error} />
        </div>
      )
  }
}
