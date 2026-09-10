"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Settings,
  Palette,
  Mail,
  CreditCard,
  Shield,
  Loader2,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  Save,
  X as XIcon,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useSettingsForm } from "./use-settings-form"
import { GeneralTab } from "./_components/general-tab"
import { BrandingTab } from "./_components/branding-tab"
import { EmailTab } from "./_components/email-tab"
import { PaymentTab } from "./_components/payment-tab"
import { SecurityTab } from "./_components/security-tab"
import { Skeleton } from "@/components/ui/skeleton"

type TabId = "general" | "branding" | "email" | "payment" | "security"

const tabs: {
  id: TabId
  label: string
  icon: LucideIcon
  description: string
}[] = [
  { id: "general", label: "General", icon: Settings, description: "Site name, logo, favicon and currency" },
  { id: "branding", label: "Branding", icon: Palette, description: "Colors, theme and visual identity" },
  { id: "email", label: "Email", icon: Mail, description: "Templates, sender and reply-to" },
  { id: "payment", label: "Payment", icon: CreditCard, description: "Providers, currencies and tax rules" },
  { id: "security", label: "Security", icon: Shield, description: "Auth, sessions and access policy" },
]

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab")
  const isValidTab = (v: string | null): v is TabId =>
    v === "general" ||
    v === "branding" ||
    v === "email" ||
    v === "payment" ||
    v === "security"
  const form = useSettingsForm()
  const uploadFile = useAction(api.storage.uploadFile)
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    isValidTab(initialTab) ? initialTab : "general"
  )
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (activeTab === "general") {
      params.delete("tab")
    } else {
      params.set("tab", activeTab)
    }
    const qs = params.toString()
    router.replace(
      qs ? `/admin/settings?${qs}` : "/admin/settings",
      { scroll: false }
    )
  }, [activeTab, router, searchParams])

  useEffect(() => {
    if (!form.isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [form.isDirty])

  const handleUpload = async (
    file: File,
    folder: string,
    settingKey: string
  ) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB")
      return
    }
    setUploading(folder)
    try {
      const buffer = await file.arrayBuffer()
      const result = await uploadFile({
        name: file.name,
        content: buffer,
        contentType: file.type,
        folder,
      })
      if (result?.url) {
        form.setValue(settingKey, result.url)
      } else if (result?.storageId) {
        const fallbackUrl = `/api/storage/${result.storageId}`
        form.setValue(settingKey, fallbackUrl)
      } else {
        throw new Error("No storage ID returned")
      }
      toast.success(`${folder} uploaded — saving...`)
      await form.save()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      toast.error("Upload failed", { description: msg })
    } finally {
      setUploading(null)
    }
  }

  const handleSave = async () => {
    await form.save()
  }

  const handleDiscard = () => {
    form.reset()
    toast.info("Changes discarded")
  }

  const handleRestoreTab = () => {
    form.restoreTab(activeTab)
    toast.info("Tab changes reverted")
  }

  const activeTabMeta = tabs.find((t) => t.id === activeTab)!

  if (form.loading) {
    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#0B2545] to-[#0F3058] px-6 py-8 lg:px-8 lg:py-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <Skeleton className="h-3 w-32 bg-white/10" />
              <Skeleton className="h-8 w-48 bg-white/10" />
              <Skeleton className="h-4 w-72 bg-white/10" />
            </div>
            <Skeleton className="h-9 w-40 bg-white/10" />
          </div>
        </section>
        <div className="flex gap-2 rounded-2xl border border-border/70 bg-white p-2 shadow-card">
          {tabs.map((t) => (
            <Skeleton key={t.id} className="h-12 w-32" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-28">
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
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-white/50">
              <Link
                href="/admin"
                className="transition-colors hover:text-white/80"
              >
                Dashboard
              </Link>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="text-white/70">Settings</span>
            </nav>
            <h1 className="mt-3 font-heading text-2xl font-bold text-white sm:text-3xl">
              Settings
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/60">
              Manage your store preferences, integrations, and security
            </p>
            {form.isDirty ? (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-100">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                {form.dirtyCount} unsaved change
                {form.dirtyCount === 1 ? "" : "s"}
              </div>
            ) : form.lastSavedAt ? (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                <CheckCircle2 className="h-3 w-3" />
                All changes saved ·{" "}
                {new Date(form.lastSavedAt).toLocaleTimeString()}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDiscard}
              disabled={!form.isDirty || form.saving}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-4 w-4" /> Discard all
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.isDirty || form.saving}
              className="gradient-gold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
            >
              {form.saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </Button>
          </div>
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
      >
        {/* Tab Bar */}
        <div className="rounded-2xl border border-border/70 bg-white p-1 shadow-card">
          <TabsList className="h-auto gap-1 bg-transparent p-0">
            {tabs.map((t) => {
              const Icon = t.icon
              const dirty = form.dirtyTabs.has(t.id)
              const active = activeTab === t.id
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    "data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {dirty && (
                    <span
                      className="ml-1 h-1.5 w-1.5 rounded-full bg-white/40"
                      aria-label={`Unsaved changes in ${t.label}`}
                    />
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* Tab Context Strip */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-card">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-dark">
            <activeTabMeta.icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold text-foreground">
              {activeTabMeta.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeTabMeta.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestoreTab}
            disabled={!form.dirtyTabs.has(activeTab) || form.saving}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Revert tab
          </Button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          <TabsContent value="general">
            <GeneralTab
              form={form}
              uploading={uploading}
              onUpload={handleUpload}
            />
          </TabsContent>
          <TabsContent value="branding">
            <BrandingTab form={form} />
          </TabsContent>
          <TabsContent value="email">
            <EmailTab />
          </TabsContent>
          <TabsContent value="payment">
            <PaymentTab form={form} />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab form={form} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Sticky Action Bar */}
      {form.isDirty && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {form.lastSavedAt ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Last saved{" "}
                  {new Date(form.lastSavedAt).toLocaleTimeString()}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {form.dirtyCount} unsaved change
                  {form.dirtyCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestoreTab}
                aria-label={`Revert changes in the ${activeTab} tab`}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Revert Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscard}
                aria-label="Discard all unsaved changes"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={form.saving}
                aria-label="Save all changes"
                className="gradient-gold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
              >
                {form.saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
