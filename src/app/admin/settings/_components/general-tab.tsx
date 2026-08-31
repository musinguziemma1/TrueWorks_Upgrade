"use client";

import { useRef, useState, useCallback } from "react";
import { Loader2, X, Upload, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SettingsField } from "./settings-field";
import { SETTING_BY_KEY } from "@convex/settingsSchema";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SettingsForm } from "../use-settings-form";

interface GeneralTabProps {
  form: SettingsForm
  uploading: string | null
  onUpload: (file: File, folder: string, settingKey: string) => void
}

function UploadZone({
  label,
  accept,
  folder,
  settingKey,
  value,
  uploading,
  onUpload,
  onRemove,
  iconSize = "h-10 w-auto",
}: {
  label: string
  accept: string
  folder: string
  settingKey: string
  value: string | number | boolean | undefined
  uploading: string | null
  onUpload: (file: File, folder: string, settingKey: string) => void
  onRemove: () => void
  iconSize?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const currentUrl = value ? String(value) : ""
  const isUploading = uploading === folder

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File must be under 2MB")
        return
      }
      onUpload(file, folder, settingKey)
    },
    [folder, settingKey, onUpload]
  )

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer",
          dragOver ? "border-amber-400 bg-amber-50/50" : "border-border hover:border-primary/50"
        )}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
      >
        {isUploading ? (
          <div className="py-4">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : currentUrl ? (
          <div className="space-y-3">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element -- storage URL */}
              <img
                src={currentUrl}
                alt={`Current ${label.toLowerCase()}`}
                className={cn("mx-auto object-contain rounded border border-border bg-white", iconSize)}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600 transition-colors"
                aria-label={`Remove ${label.toLowerCase()}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-emerald-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Uploaded — drop or click to replace
            </p>
          </div>
        ) : (
          <div className="py-4">
            <div className="rounded-lg bg-muted/50 p-3 inline-block mb-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Drop image here or <span className="text-amber-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{label === "Site Logo" ? "PNG, SVG up to 2MB" : "32×32px ICO/PNG"}</p>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}

export function GeneralTab({ form, uploading, onUpload }: GeneralTabProps) {
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
          <CardDescription>Brand assets displayed in the header and browser tab. Drag and drop or click to upload.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <UploadZone
              label="Site Logo"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              folder="Logos"
              settingKey="siteLogo"
              value={form.values.siteLogo}
              uploading={uploading}
              onUpload={onUpload}
              onRemove={() => form.setValue("siteLogo", "")}
              iconSize="h-12 w-auto"
            />
            <UploadZone
              label="Favicon"
              accept="image/x-icon,image/png,image/svg+xml"
              folder="Favicons"
              settingKey="siteFavicon"
              value={form.values.siteFavicon}
              uploading={uploading}
              onUpload={onUpload}
              onRemove={() => form.setValue("siteFavicon", "")}
              iconSize="h-8 w-8"
            />
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
