"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Mail, Save, RotateCcw, Eye, Code, Loader2, Plus, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TemplateSummary {
  id: string;
  name: string;
  subject: string;
  description: string;
  variables: string[];
  isCustomized: boolean;
}

interface TemplateDetail extends TemplateSummary {
  customSubject: string | null;
  customHtml: string | null;
}

// Sample values used when previewing a template.
const SAMPLE_VALUES: Record<string, string> = {
  customerName: "Jane Doe",
  orderNumber: "TW-A1B2C3",
  items: "• Hospital KPI Dashboard × 1<br/>• NGO Grant Tracker × 2",
  total: "USD 45.00",
  productName: "Hospital KPI Dashboard",
  downloadUrl: "https://trueworksgroup.com/account/downloads",
  amount: "USD 45.00",
  reason: "Not as expected",
  subscriberName: "Jane Doe",
  invitedBy: "TrueWorks Admin",
  role: "Editor",
  expiryDate: "14 days",
  totalValue: "USD 45.00",
};

function injectSample(html: string): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key: string) => SAMPLE_VALUES[key] ?? match);
}

function TemplateEditor({ templateId }: { templateId: string }) {
  const templateDetail = useQuery(
    api.emailTemplates.getTemplate,
    templateId ? { templateId } : "skip"
  ) as TemplateDetail | null | undefined;
  const saveTemplate = useMutation(api.emailTemplates.saveTemplate);
  const resetTemplate = useMutation(api.emailTemplates.resetTemplate);

  // null = "not edited yet" → fall back to the saved/default values.
  const [subjectOverride, setSubjectOverride] = useState<string | null>(null);
  const [htmlOverride, setHtmlOverride] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  if (!templateDetail) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const subject = subjectOverride ?? templateDetail.customSubject ?? templateDetail.subject;
  const html = htmlOverride ?? templateDetail.customHtml ?? "";
  const dirty = subjectOverride !== null || htmlOverride !== null;

  const insertVariable = (variable: string) => {
    setHtmlOverride((prev) => (prev ?? templateDetail.customHtml ?? "") + variable);
    toast.info(`Inserted ${variable}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTemplate({
        templateId: templateDetail.id,
        subject: subject.trim() || templateDetail.subject,
        html,
      });
      toast.success(`"${templateDetail.name}" template saved`);
      setSubjectOverride(null);
      setHtmlOverride(null);
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(`Reset "${templateDetail.name}" to its default content?`)) return;
    try {
      await resetTemplate({ templateId: templateDetail.id });
      setSubjectOverride(null);
      setHtmlOverride(null);
      toast.success(`"${templateDetail.name}" reset to default`);
    } catch {
      toast.error("Failed to reset template");
    }
  };

  const previewHtml = injectSample(html);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {templateDetail.name}
            </CardTitle>
            <CardDescription>{templateDetail.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")}
            >
              {viewMode === "edit" ? <Eye className="h-4 w-4 mr-1.5" /> : <Code className="h-4 w-4 mr-1.5" />}
              {viewMode === "edit" ? "Preview" : "Edit"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!templateDetail.isCustomized}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Subject Line</Label>
          <Input
            value={subject}
            onChange={(e) => setSubjectOverride(e.target.value)}
            placeholder={templateDetail.subject}
          />
          <p className="text-xs text-muted-foreground">
            Default: <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{templateDetail.subject}</code>
          </p>
        </div>

        {viewMode === "edit" ? (
          <div className="space-y-2">
            <Label>Email Content (HTML)</Label>
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {templateDetail.variables.map((v) => (
                <Badge
                  key={v}
                  variant="outline"
                  className="cursor-pointer gap-1 border-primary/20 text-primary hover:bg-primary/5"
                  onClick={() => insertVariable(v)}
                >
                  <Plus className="h-3 w-3" /> {v}
                </Badge>
              ))}
            </div>
            <Textarea
              value={html}
              onChange={(e) => setHtmlOverride(e.target.value)}
              placeholder={
                templateDetail.customHtml
                  ? "Custom HTML below — edit and save to update."
                  : "Leave empty to use the default template. Paste custom HTML to override, and insert variables above."
              }
              className="min-h-[380px] font-mono text-xs"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="min-h-[380px] rounded-lg border bg-white p-4">
              {html ? (
                <div
                  className="prose prose-sm max-w-none [&_img]:max-w-full [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {templateDetail.customHtml
                      ? "Showing the saved custom template."
                      : "Using the default template — no custom content yet."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Subject: <span className="font-medium text-foreground">{subject}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EmailTemplateManager() {
  const templates = useQuery(api.emailTemplates.listTemplates);
  const [selectedId, setSelectedId] = useState<string>("");

  if (!templates) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedTemplate = selectedId
    ? templates.find((t) => t.id === selectedId)
    : templates[0];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {/* Template list */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-sm">Templates</CardTitle>
          <CardDescription>Transactional emails sent to customers</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[520px] space-y-1 overflow-y-auto p-2">
            {templates.map((template) => {
              const active = (selectedTemplate?.id ?? templates[0]?.id) === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-primary/5 font-medium text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{template.name}</span>
                    {template.isCustomized && (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent" title="Customized" />
                    )}
                  </div>
                  <p className="mt-0.5 truncate pl-6 text-xs text-muted-foreground">{template.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Editor (keyed by template so state resets cleanly on selection) */}
      {selectedTemplate && <TemplateEditor key={selectedTemplate.id} templateId={selectedTemplate.id} />}
    </div>
  );
}