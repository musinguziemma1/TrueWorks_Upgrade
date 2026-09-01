"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Settings, Palette, Mail, CreditCard, Download, Shield, Loader2, CheckCircle2, RotateCcw } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"
import { useSettingsForm } from "./use-settings-form"
import { GeneralTab } from "./_components/general-tab"
import { BrandingTab } from "./_components/branding-tab"
import { EmailTab } from "./_components/email-tab"
import { PaymentTab } from "./_components/payment-tab"
import { DownloadsTab } from "./_components/downloads-tab"
import { SecurityTab } from "./_components/security-tab"
import { Skeleton } from "@/components/ui/skeleton"

type TabId = "general" | "branding" | "email" | "payment" | "downloads" | "security"

const tabs: { id: TabId; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "email", label: "Email", icon: Mail },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "security", label: "Security", icon: Shield },
]

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab")
  const isValidTab = (v: string | null): v is TabId =>
    v === "general" || v === "branding" || v === "email" || v === "payment" || v === "downloads" || v === "security"
  const form = useSettingsForm()
  const uploadFile = useAction(api.storage.uploadFile)
  const [activeTab, setActiveTab] = useState<TabId>(() => (isValidTab(initialTab) ? initialTab : "general"))
  const [uploading, setUploading] = useState<string | null>(null)

  // Keep the URL in sync with the active tab so views are shareable and refresh-safe.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (activeTab === "general") {
      params.delete("tab")
    } else {
      params.set("tab", activeTab)
    }
    const qs = params.toString()
    router.replace(qs ? `/admin/settings?${qs}` : "/admin/settings", { scroll: false })
  }, [activeTab, router, searchParams])

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!form.isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [form.isDirty])

  const handleUpload = async (file: File, folder: string, settingKey: string) => {
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
      toast.success(`${folder} uploaded — saving…`)
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

  if (form.loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Settings"
          description="Manage your store preferences, integrations, and security."
          breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]}
        />
        <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
          {tabs.map((t) => (
            <Skeleton key={t.id} className="h-8 w-24" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <AdminPageHeader
        title="Settings"
        description="Manage your store preferences, integrations, and security."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]}
        action={
          form.isDirty ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              {form.dirtyCount} unsaved change{form.dirtyCount === 1 ? "" : "s"}
            </span>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <TabsList className="w-full justify-start">
          {tabs.map((t) => {
            const Icon = t.icon
            const dirty = form.dirtyTabs.has(t.id)
            return (
              <TabsTrigger key={t.id} value={t.id}>
                <Icon className="h-4 w-4" />
                {t.label}
                {dirty && (
                  <span className="ml-1 size-1.5 rounded-full bg-amber-500" aria-label={`Unsaved changes in ${t.label}`} />
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general">
            <GeneralTab form={form} uploading={uploading} onUpload={handleUpload} />
          </TabsContent>
          <TabsContent value="branding">
            <BrandingTab form={form} />
          </TabsContent>
          <TabsContent value="email">
            <EmailTab form={form} />
          </TabsContent>
          <TabsContent value="payment">
            <PaymentTab form={form} />
          </TabsContent>
          <TabsContent value="downloads">
            <DownloadsTab form={form} />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab form={form} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Sticky action bar */}
      {form.isDirty && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {form.lastSavedAt ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Last saved {new Date(form.lastSavedAt).toLocaleTimeString()}
                </span>
              ) : (
                <span>{form.dirtyCount} unsaved change{form.dirtyCount === 1 ? "" : "s"}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRestoreTab} aria-label={`Revert changes in the ${activeTab} tab`}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Revert Tab
              </Button>
              <Button variant="outline" size="sm" onClick={handleDiscard} aria-label="Discard all unsaved changes">
                Discard
              </Button>
              <Button size="sm" onClick={handleSave} disabled={form.saving} aria-label="Save all changes">
                {form.saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
