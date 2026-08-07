"use client"

import { useState } from "react"
import { Mail, ArrowLeft, Save, RotateCcw, Eye, Code, Loader2 } from "lucide-react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function EmailTemplatesPage() {
  const templates = useQuery(api.emailTemplates.listTemplates)
  const getTemplate = useQuery(
    api.emailTemplates.getTemplate,
    templates ? { templateId: templates[0]?.id ?? "" } : "skip"
  )
  const saveTemplate = useMutation(api.emailTemplates.saveTemplate)
  const resetTemplate = useMutation(api.emailTemplates.resetTemplate)

  const [selectedId, setSelectedId] = useState<string>("")
  const [editSubject, setEditSubject] = useState("")
  const [editHtml, setEditHtml] = useState("")
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit")

  const selectedTemplate = selectedId
    ? templates?.find((t) => t.id === selectedId)
    : templates?.[0]

  const templateDetail = useQuery(
    api.emailTemplates.getTemplate,
    selectedTemplate ? { templateId: selectedTemplate.id } : "skip"
  )

  // Update edit state when template loads
  const handleSelectTemplate = (id: string) => {
    setSelectedId(id)
    setViewMode("edit")
  }

  // Sync edit fields when template detail changes
  if (templateDetail && templateDetail.id === (selectedTemplate?.id ?? templates?.[0]?.id)) {
    if (editSubject === "" && templateDetail.customSubject) {
      setEditSubject(templateDetail.customSubject)
    }
    if (editHtml === "" && templateDetail.customHtml) {
      setEditHtml(templateDetail.customHtml)
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate) return
    setSaving(true)
    try {
      await saveTemplate({
        templateId: selectedTemplate.id,
        subject: editSubject,
        html: editHtml,
      })
      toast.success(`"${selectedTemplate.name}" template saved`)
    } catch {
      toast.error("Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!selectedTemplate) return
    try {
      await resetTemplate({ templateId: selectedTemplate.id })
      setEditSubject(selectedTemplate.subject)
      setEditHtml("")
      toast.success(`"${selectedTemplate.name}" template reset to default`)
    } catch {
      toast.error("Failed to reset template")
    }
  }

  if (!templates) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Email Templates"
          description="Customize transactional email templates sent to customers."
          breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Email Templates" }]}
        />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Templates"
        description="Customize transactional email templates sent to customers."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Email Templates" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Templates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    (selectedTemplate?.id ?? templates[0]?.id) === template.id
                      ? "bg-primary/5 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{template.name}</span>
                    {template.isCustomized && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-accent shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTemplate?.name ?? "Select a template"}</CardTitle>
                <CardDescription>{selectedTemplate?.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")}
                >
                  {viewMode === "edit" ? <Eye className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
                  {viewMode === "edit" ? "Preview" : "Edit"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Reset
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTemplate && (
              <>
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    value={editSubject || selectedTemplate.subject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder={selectedTemplate.subject}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: {selectedTemplate.variables.join(", ")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Email Content (HTML)</Label>
                  {viewMode === "edit" ? (
                    <Textarea
                      value={editHtml || ""}
                      onChange={(e) => setEditHtml(e.target.value)}
                      placeholder="Leave empty to use the default template. Paste custom HTML to override."
                      className="min-h-[400px] font-mono text-xs"
                    />
                  ) : (
                    <div className="border rounded-lg p-4 bg-white min-h-[400px]">
                      {editHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: editHtml }} />
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-20">
                          Using default template. Edit to customize.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
