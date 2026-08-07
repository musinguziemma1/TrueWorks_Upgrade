"use client"

import { useState, useRef } from "react"
import NextImage from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Send, Upload, Plus, X, Image, FileText, Settings, Eye, Download, Loader2, Trash2 } from "lucide-react"
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
import { toast } from "sonner"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  createProduct,
  uploadFile,
  useCategories,
  ProductStatus,
  ProductInput,
} from "@/lib/admin-queries"

interface FaqItem { question: string; answer: string }

export default function NewProductPage() {
  const router = useRouter()
  const [publishing, setPublishing] = useState(false)

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [sku, setSku] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [tiers, setTiers] = useState<{ name: string; price: string; salePrice: string; quantity: string }[]>([])
  const [category, setCategory] = useState("")
  const [industry, setIndustry] = useState("")
  const [fileType, setFileType] = useState("")
  const [tags, setTags] = useState("")
  const [version, setVersion] = useState("1.0.0")
  const [demoVideo, setDemoVideo] = useState("")
  const [changelog, setChangelog] = useState("")
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [downloadLimit, setDownloadLimit] = useState("")
  const [downloadExpiry, setDownloadExpiry] = useState("")
  const [featured, setFeatured] = useState(false)
  const [status, setStatus] = useState<ProductStatus>("draft")

  const [thumbnail, setThumbnail] = useState("")
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [downloadableFileUrl, setDownloadableFileUrl] = useState("")
  const [downloadableFileStorageId, setDownloadableFileStorageId] = useState<ProductInput["downloadableFileStorageId"]>(undefined)
  const [fileSize, setFileSize] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)

  const [faqs, setFaqs] = useState<FaqItem[]>([{ question: "", answer: "" }])

  const thumbInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const create = createProduct.useMutation()
  const upload = uploadFile.useAction()
  const dbCategories = useCategories()
  const categories = (dbCategories ?? []).map((c) => c.name)
  const industries = ["Business", "Technology", "E-commerce", "Design", "Marketing", "Analytics", "SaaS", "Finance", "Creative", "CRM", "Social Media", "HR", "Education"]
  const fileTypes = ["PDF", "ZIP", "MP4", "AI", "PSD", "Figma", "HTML", "JS", "Excel", "CSV", "XLSX", "XLS"]

  const addFaq = () => setFaqs([...faqs, { question: "", answer: "" }])
  const removeFaq = (i: number) => setFaqs(faqs.filter((_, idx) => idx !== i))
  const updateFaq = (i: number, field: keyof FaqItem, value: string) => {
    const next = [...faqs]
    next[i] = { ...next[i], [field]: value }
    setFaqs(next)
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      const arrayBuf = await file.arrayBuffer()
      const { url } = await upload({ name: file.name, content: arrayBuf, contentType: file.type, folder: "Products" })
      setThumbnail(url ?? "")
      toast.success("Thumbnail uploaded")
    } catch (err) {
      toast.error(`Upload failed: ${String(err)}`)
    } finally {
      setUploadingThumb(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingGallery(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const arrayBuf = await file.arrayBuffer()
        const result = await upload({ name: file.name, content: arrayBuf, contentType: file.type, folder: "Products" })
        if (result.url) urls.push(result.url)
      }
      setGalleryImages([...galleryImages, ...urls])
      toast.success(`${urls.length} images uploaded`)
    } catch (err) {
      toast.error(`Upload failed: ${String(err)}`)
    } finally {
      setUploadingGallery(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const arrayBuf = await file.arrayBuffer()
      const result = await upload({ name: file.name, content: arrayBuf, contentType: file.type, folder: "Downloads" })
      setDownloadableFileUrl(result.url ?? "")
      setDownloadableFileStorageId(result.storageId ?? undefined)
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)
      toast.success("File uploaded")
    } catch (err) {
      toast.error(`Upload failed: ${String(err)}`)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSave = async (publishNow = false) => {
    if (!name || !slug || !sku || !price || !category || !industry) {
      toast.error("Please fill in all required fields")
      return
    }

    const payload = {
      name,
      slug,
      sku,
      shortDescription,
      description,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      pricingTiers: tiers
        .filter((t) => t.name.trim() && t.price)
        .map((t) => ({
          name: t.name.trim(),
          price: Number(t.price),
          salePrice: t.salePrice ? Number(t.salePrice) : undefined,
          quantity: t.quantity ? Number(t.quantity) : undefined,
        })),
      category,
      industry,
      fileType: fileType || "ZIP",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      galleryImages,
      thumbnail,
      downloadableFile: downloadableFileUrl || undefined,
      downloadableFileStorageId: downloadableFileStorageId ?? undefined,
      fileSize: fileSize || undefined,
      version: version || undefined,
      changelog: changelog || undefined,
      downloadLimit: downloadLimit ? Number(downloadLimit) : undefined,
      downloadExpiry: downloadExpiry ? Number(downloadExpiry) * 24 * 60 * 60 * 1000 : undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      faqs: faqs.filter((f) => f.question && f.answer),
      demoVideo: demoVideo || undefined,
      featured,
      status: publishNow ? ("published" as ProductStatus) : status,
    }

    try {
      await create(payload as never)
      toast.success(publishNow ? "Product published!" : "Draft saved!")
      router.push("/admin/products")
    } catch (err) {
      toast.error(`Error: ${String(err)}`)
    }
  }

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
                    <Label>Product Name *</Label>
                    <Input placeholder="Enter product name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Slug *</Label>
                      <Input placeholder="product-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU *</Label>
                      <Input placeholder="e.g. PRD-001" value={sku} onChange={(e) => setSku(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Pricing</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (USD) *</Label>
                    <Input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Price (USD)</Label>
                    <Input type="number" placeholder="0 (optional)" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
                  </div>
                </CardContent>
                <CardContent className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">License Tiers</Label>
                    <Button variant="ghost" size="sm" onClick={() => setTiers([...tiers, { name: "", price: "", salePrice: "", quantity: "" }])}>
                      <Plus className="h-3 w-3" /> Add Tier
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional per-tier pricing (e.g. Single, Team, Enterprise). Leave empty for a simple one-price product.
                  </p>
                  {tiers.length === 0 && (
                    <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No tiers — this product sells at its base price.
                    </p>
                  )}
                  {tiers.map((t, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto]">
                      <Input placeholder="Tier name" value={t.name} onChange={(e) => {
                        const next = [...tiers]; next[i] = { ...next[i], name: e.target.value }; setTiers(next);
                      }} />
                      <Input type="number" placeholder="Price" value={t.price} onChange={(e) => {
                        const next = [...tiers]; next[i] = { ...next[i], price: e.target.value }; setTiers(next);
                      }} />
                      <Input type="number" placeholder="Sale" value={t.salePrice} onChange={(e) => {
                        const next = [...tiers]; next[i] = { ...next[i], salePrice: e.target.value }; setTiers(next);
                      }} />
                      <Input type="number" placeholder="Seats" value={t.quantity} onChange={(e) => {
                        const next = [...tiers]; next[i] = { ...next[i], quantity: e.target.value }; setTiers(next);
                      }} />
                      <button onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))} className="flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="description">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Description</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea placeholder="Brief description of the product" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Description</Label>
                    <RichTextEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Detailed product description with features and benefits..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="organization">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Organization</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={category} onValueChange={(v) => { if (v) setCategory(v) }}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Industry *</Label>
                    <Select value={industry} onValueChange={(v) => { if (v) setIndustry(v) }}>
                      <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>File Type</Label>
                    <Select value={fileType} onValueChange={(v) => { if (v) setFileType(v) }}>
                      <SelectTrigger><SelectValue placeholder="Select file type" /></SelectTrigger>
                      <SelectContent>{fileTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input placeholder="Comma separated tags" value={tags} onChange={(e) => setTags(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" /> Media</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Thumbnail *</Label>
                    {thumbnail ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                        <NextImage src={thumbnail} alt="Thumbnail" fill sizes="128px" className="object-cover" />
                        <button onClick={() => setThumbnail("")} className="absolute top-1 right-1 p-1 bg-white/80 rounded-md hover:bg-white">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => thumbInputRef.current?.click()}
                      >
                        {uploadingThumb ? (
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                        ) : (
                          <Image className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        )}
                        <p className="text-sm text-muted-foreground">Click to upload thumbnail</p>
                      </div>
                    )}
                    <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                  </div>

                  <div className="space-y-2">
                    <Label>Gallery Images</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {galleryImages.map((url, i) => (
                        <div key={i} className="relative w-full h-20 rounded-lg overflow-hidden border">
                          <NextImage src={url} alt="" fill sizes="25vw" className="object-cover" />
                          <button onClick={() => setGalleryImages(galleryImages.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 bg-white/80 rounded-md hover:bg-white">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <div
                        className="w-full h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        {uploadingGallery ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Additional</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingFile ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {downloadableFileUrl ? "File uploaded - click to replace" : "Upload downloadable file"}
                    </p>
                    {fileSize && <p className="text-xs text-muted-foreground mt-1">{fileSize}</p>}
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Version</Label>
                      <Input defaultValue="1.0.0" placeholder="1.0.0" value={version} onChange={(e) => setVersion(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Demo Video URL</Label>
                      <Input placeholder="https://youtube.com/..." value={demoVideo} onChange={(e) => setDemoVideo(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Changelog</Label>
                    <Textarea placeholder="Describe what's new in this version" value={changelog} onChange={(e) => setChangelog(e.target.value)} />
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
                    <Input placeholder="Meta title for search engines" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Description</Label>
                    <Textarea placeholder="Meta description for search engines" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
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
                    <Switch checked={featured} onCheckedChange={setFeatured} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label>Download Limit</Label>
                      <Input type="number" placeholder="Unlimited" value={downloadLimit} onChange={(e) => setDownloadLimit(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Download Expiry (days)</Label>
                      <Input type="number" placeholder="Never" value={downloadExpiry} onChange={(e) => setDownloadExpiry(e.target.value)} />
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
                <Select value={status} onValueChange={(v) => { if (v) setStatus(v as ProductStatus) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {status === "draft" ? "Only visible to admins" : status === "published" ? "Visible to all customers" : "Hidden from customers"}
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sticky top-20">
              <Button size="lg" className="w-full" variant="outline" onClick={() => handleSave(false)}>
                <Save className="h-4 w-4" /> Save Draft
              </Button>
              <Button size="lg" className="w-full" onClick={() => handleSave(true)}>
                <Send className="h-4 w-4" /> Publish
              </Button>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
