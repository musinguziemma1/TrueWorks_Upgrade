"use client"

import { useState, useRef } from "react"
import { Upload, Search, Folder, File, FileImage, FileVideo, FileArchive, MoreHorizontal, Loader2, Trash2, Download, Eye } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  useMediaFiles,
  uploadFile,
  deleteMediaFile,
} from "@/lib/admin-queries"

const folders = ["All Media", "Banners", "Products", "Videos", "Downloads", "Brand", "Screenshots", "Team", "Documents", "Templates"]

const getTypeIcon = (contentType: string) => {
  if (contentType.startsWith("image/")) return <FileImage className="h-8 w-8 text-blue-500" />
  if (contentType.startsWith("video/")) return <FileVideo className="h-8 w-8 text-purple-500" />
  if (contentType.includes("zip") || contentType.includes("archive")) return <FileArchive className="h-8 w-8 text-amber-500" />
  if (contentType.includes("pdf") || contentType.includes("document")) return <File className="h-8 w-8 text-red-500" />
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFolder, setSelectedFolder] = useState("General")

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return
    try {
      await remove({ id: id as never })
      toast.success("File deleted")
    } catch (err) {
      toast.error(String(err))
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
              accept="image/*,video/*,.pdf,.zip,.doc,.docx"
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
            <p className="text-xs text-muted-foreground mt-1">Images, videos, documents up to 100MB</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((file) => (
                <Card key={file._id} className="overflow-hidden group">
                  <div className="h-32 bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center relative">
                    {file.contentType.startsWith("image/") ? (
                      <img
                        src={String(file.storageId)}
                        alt={file.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => { setPreviewUrl(String(file.storageId)); setPreviewName(file.name) }}
                      />
                    ) : (
                      getTypeIcon(file.contentType)
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="absolute top-2 right-2 p-1 rounded-md bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setPreviewUrl(String(file.storageId)); setPreviewName(file.name) }}>
                          <Eye className="h-4 w-4 mr-2" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(String(file.url ?? file.storageId), '_blank')}>
                          <Download className="h-4 w-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(file._id)}>
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

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {previewUrl && <img src={previewUrl} alt={previewName} className="max-h-[60vh] object-contain rounded-lg" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
