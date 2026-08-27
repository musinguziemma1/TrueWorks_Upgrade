"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, Search, Folder, File, FileImage, FileVideo, FileArchive, MoreHorizontal, Loader2, Trash2, Download, Eye, FileSpreadsheet } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files ?? [])
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media Library"
        description="Manage images, documents, and downloadable files."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Media" }]}
        action={
          <div className="flex gap-2">
            <Select value={selectedFolder} onValueChange={(v) => { if (v) setSelectedFolder(v) }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {folders.filter((f) => f !== "All Media").map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Files
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Folders</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-0.5 p-2">
                  {folders.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFolder(f)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFolder === f ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        <span>{f}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search media files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            )}
            <p className="text-sm text-muted-foreground">Drag & drop files here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Images, videos, documents, Excel/CSV files up to 100MB</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((file) => (
                <Card key={file._id} className="overflow-hidden group">
                  <div className="h-32 bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center relative">
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
                      <DropdownMenuTrigger className="absolute top-2 right-2 p-1 rounded-md bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Actions for ${file.name}`}>
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
                    <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)} &middot; {new Date(file.createdAt).toLocaleDateString("en-UG")}</p>
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
        </div>
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
