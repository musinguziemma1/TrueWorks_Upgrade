"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Send, Upload, Plus, X, Image, FileText, LinkIcon, Settings, Eye, Download } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface FaqItem { question: string; answer: string }

export default function NewProductPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([{ question: "", answer: "" }])
  const addFaq = () => setFaqs([...faqs, { question: "", answer: "" }])
  const removeFaq = (i: number) => setFaqs(faqs.filter((_, idx) => idx !== i))
  const updateFaq = (i: number, field: keyof FaqItem, value: string) => {
    const next = [...faqs]
    next[i] = { ...next[i], [field]: value }
    setFaqs(next)
  }

  const categories = ["Templates", "Dashboards", "Bundles", "Components", "Marketing", "Tools", "Software"]
  const industries = ["Business", "Technology", "E-commerce", "Design", "Marketing", "Analytics", "SaaS", "Finance", "Creative", "CRM", "Social Media", "HR"]
  const fileTypes = ["PDF", "ZIP", "MP4", "AI", "PSD", "Figma", "HTML", "JS"]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add Product"
        description="Create a new digital product for your store."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Products", href: "/admin/products" }, { label: "Add Product" }]}
        action={
          <Link href="/admin/products">
            <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to Products</Button>
          </Link>
        }
      />

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="additional">Additional</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TabsContent value="basic">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Basic Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input placeholder="Enter product name" />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input placeholder="e.g. PRD-001" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Pricing</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (UGX)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Price (UGX)</Label>
                    <Input type="number" placeholder="0 (optional)" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="description">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Description</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea placeholder="Brief description of the product" />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Description</Label>
                    <Textarea placeholder="Detailed product description with features and benefits..." className="min-h-[200px]" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="organization">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Organization</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>File Type</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select file type" /></SelectTrigger>
                      <SelectContent>{fileTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input placeholder="Comma separated tags" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" /> Media</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Gallery Images</Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Drag & drop images here, or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP up to 5MB</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Thumbnail</Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Image className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Upload thumbnail image</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Additional</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Drag & drop your downloadable file here</p>
                    <p className="text-xs text-muted-foreground mt-1">ZIP, PDF, MP4 up to 100MB</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Version</Label>
                      <Input defaultValue="1.0.0" placeholder="1.0.0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Demo Video URL</Label>
                      <Input placeholder="https://youtube.com/..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Changelog</Label>
                    <Textarea placeholder="Describe what's new in this version" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>FAQ</Label>
                      <Button variant="ghost" size="sm" onClick={addFaq}><Plus className="h-3 w-3" /> Add Question</Button>
                    </div>
                    <div className="space-y-3">
                      {faqs.map((faq, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-2">
                            <Input value={faq.question} onChange={(e) => updateFaq(i, "question", e.target.value)} placeholder="Question" />
                            <Textarea value={faq.answer} onChange={(e) => updateFaq(i, "answer", e.target.value)} placeholder="Answer" rows={2} />
                          </div>
                          {faqs.length > 1 && (
                            <button onClick={() => removeFaq(i)} className="p-2 mt-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> SEO</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>SEO Title</Label>
                    <Input placeholder="Meta title for search engines" />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Description</Label>
                    <Textarea placeholder="Meta description for search engines" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Featured Product</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Track Inventory</Label>
                    <Switch />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label>Download Limit</Label>
                      <Input type="number" placeholder="Unlimited" />
                    </div>
                    <div className="space-y-2">
                      <Label>Download Expiry (days)</Label>
                      <Input type="number" placeholder="Never" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Status</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="default" className="flex-1">Draft</Button>
                  <Button variant="outline" className="flex-1">Published</Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sticky top-20">
              <Button size="lg" className="w-full"><Save className="h-4 w-4" /> Save Draft</Button>
              <Button size="lg" variant="secondary" className="w-full"><Send className="h-4 w-4" /> Publish</Button>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
