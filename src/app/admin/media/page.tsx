"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, Search, Folder, File, FileImage, FileVideo, FileArchive, MoreHorizontal, Loader2, Trash2, Download, Eye, FileSpreadsheet, Image as ImageIcon, HardDrive, FolderOpen, Sparkles } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { toast } from "sonner"
import { ExcelPreviewDialog } from "@/components/ui/excel-preview-dialog"
import {
  useMediaFiles,
  uploadFile,
  deleteMediaFile,
} from "@/lib/admin-queries"

const folders = ["All Media", "Banners", "Products", "Videos", "Downloads", "Brand", "Screenshots", "Team", "Documents", "Templates"]

const EXCEL_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
])

function isExcelFile(contentType: string, name: string): boolean {
  if (EXCEL_TYPES.has(contentType)) return true
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  return ["xlsx", "xls", "xlsm", "xlsb", "csv"].includes(ext)
}

const getTypeIcon = (contentType: string, name?: string) => {
  if (contentType.startsWith("image/")) return <FileImage className="h-8 w-8 text-blue-500" />
  if (contentType.startsWith("video/")) return <FileVideo className="h-8 w-8 text-purple-500" />
  if (contentType.includes("zip") || contentType.includes("archive")) return <FileArchive className="h-8 w-8 text-amber-500" />
  if (contentType.includes("pdf")) return <File className="h-8 w-8 text-red-500" />
  if (name && isExcelFile(contentType, name)) return <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
  return <File className="h-8 w-8 text-muted-foreground" />
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatCount = (count: number) => new Intl.NumberFormat("en-UG").format(count)

export default function MediaPage() {
  const [search, setSearch] = useState("")
  const [activeFolder, setActiveFolder] = useState("All Media")
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState("")
  const [excelPreviewUrl, setExcelPreviewUrl] = useState<string | null>(null)
  const [excelPreviewName, setExcelPreviewName] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFolder, setSelectedFolder] = useState("All Media")

  const files = useMediaFiles(activeFolder === "All Media" ? undefined : activeFolder)
  const upload = uploadFile.useAction()
  const remove = deleteMediaFile.useMutation()

  const isLoading = files === undefined

  const filtered = (files ?? []).filter((f) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleFilesUpload = async (uploadedFiles: File[]) => {
    if (!uploadedFiles.length) return
    setUploading(true)
    try {
      for (const file of uploadedFiles) {
        const arrayBuf = await file.arrayBuffer()
        await upload({
          name: file.name,
          content: arrayBuf,
          contentType: file.type,
          folder: selectedFolder,
        })
      }
      toast.success(`${uploadedFiles.length} file(s) uploaded`)
    } catch (err) {
      toast.error(`Upload failed: ${String(err)}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFilesUpload(Array.from(e.target.files ?? []))
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      await remove({ id: deleteId as never })
      toast.success("File deleted")
    } catch (err) {
      toast.error(String(err))
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handlePreview = (file: { url?: string | null; name: string; contentType: string }) => {
    if (!file.url) return
    if (isExcelFile(file.contentType, file.name)) {
      setExcelPreviewUrl(file.url)
      setExcelPreviewName(file.name)
    } else {
      setPreviewUrl(file.url)
      setPreviewName(file.name)
    }
  }

  const totalSize = filtered.reduce((total, file) => total + (file.size ?? 0), 0)
  const imageCount = filtered.filter((file) => file.contentType.startsWith("image/")).length

  return (
    <div className="space-y-6 pb-8">
      <AdminPageHeader
        title="Media Library"
        description="A home for every asset powering your storefront."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Media" }]}
        action={
          <div className="flex flex-wrap gap-2">
            <Select value={selectedFolder} onValueChange={(v) => { if (v) setSelectedFolder(v) }}>
              <SelectTrigger className="w-[145px] bg-background"><FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent>
                {folders.filter((f) => f !== "All Media").map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Add media
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.zip,.doc,.docx,.xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Visible assets", value: formatCount(filtered.length), icon: FolderOpen, detail: activeFolder },
          { label: "Images", value: formatCount(imageCount), icon: ImageIcon, detail: "Ready for storefront use" },
          { label: "Storage shown", value: formatSize(totalSize), icon: HardDrive, detail: search ? "Current search" : "Current folder" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 shadow-[0_1px_2px_rgb(11_37_69/0.03)]">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary"><stat.icon className="size-4" /></div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2"><p className="text-lg font-semibold text-foreground">{stat.value}</p><p className="truncate text-xs text-muted-foreground">{stat.detail}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="px-1"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Browse library</p><p className="mt-1 text-xs text-muted-foreground">Keep assets easy to find.</p></div>
          <Card className="overflow-hidden">
            <CardContent className="p-2">
              <ScrollArea className="h-[350px]">
                <div className="space-y-1">
                  {folders.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFolder(f)}
                      className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${activeFolder === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      <span className="flex min-w-0 items-center gap-2"><Folder className={`size-4 shrink-0 ${activeFolder === f ? "text-accent-light" : "text-muted-foreground group-hover:text-primary"}`} /><span className="truncate">{f}</span></span>
                      {f === activeFolder && <span className="size-1.5 rounded-full bg-accent-light" />}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-xl font-semibold text-primary">{activeFolder}</h2><p className="text-sm text-muted-foreground">{filtered.length ? `${formatCount(filtered.length)} assets to explore` : "Your next asset can start here"}</p></div>
            <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input aria-label="Search media files" placeholder="Search this folder..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 bg-card pl-10" /></div>
          </div>

          <div
            className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-primary px-5 py-5 text-primary-foreground shadow-[0_10px_30px_rgb(11_37_69/0.12)] sm:px-7"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); void handleFilesUpload(Array.from(e.dataTransfer.files)) }}
          >
            <div className="pointer-events-none absolute -right-10 -top-16 size-44 rounded-full border-[20px] border-accent/20" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"><Upload className="size-5 text-accent-light" /></div><div><p className="font-semibold">Bring your next asset to life</p><p className="mt-1 text-sm text-primary-foreground/70">Drop files here or browse from your computer.</p></div></div>
              <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-primary transition-transform group-hover:-translate-y-0.5"><Sparkles className="size-3.5 text-accent" /> Browse files</span>
            </div>
            <p className="relative mt-4 border-t border-white/10 pt-3 text-[11px] text-primary-foreground/55">Images, videos, documents and Excel/CSV up to 100MB</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((file) => (
                <Card key={file._id} className="group overflow-hidden border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-card">
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/[0.04] via-secondary/[0.08] to-accent/[0.12]">
                    {file.contentType.startsWith("image/") && file.url ? (
                      <Image
                        src={file.url!}
                        alt={file.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover cursor-pointer"
                        onClick={() => handlePreview(file)}
                      />
                    ) : (
                      <div className="cursor-pointer" onClick={() => handlePreview(file)}>
                        {getTypeIcon(file.contentType, file.name)}
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100" aria-label={`Actions for ${file.name}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(file)}>
                          <Eye className="h-4 w-4 mr-2" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { if (file.url) window.open(file.url, '_blank') }}>
                          <Download className="h-4 w-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(file._id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium" title={file.name}>{file.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatSize(file.size)} <span className="mx-1 text-border">•</span> {new Date(file.createdAt).toLocaleDateString("en-UG")}</p>
                  </div>
                </Card>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <File className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No files found in this folder</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Image Preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {previewUrl && (
              <Image
                src={previewUrl}
                alt={previewName}
                width={900}
                height={540}
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel Preview */}
      <ExcelPreviewDialog
        url={excelPreviewUrl ?? ""}
        fileName={excelPreviewName}
        open={!!excelPreviewUrl}
        onOpenChange={(v) => { if (!v) { setExcelPreviewUrl(null); setExcelPreviewName("") } }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open && !deleting) setDeleteId(null) }}
        title="Delete this file?"
        description="The file will be removed from storage immediately. Any public link to it will start returning 404. This action cannot be undone."
        confirmLabel="Delete file"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
