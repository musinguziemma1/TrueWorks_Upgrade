"use client"

import { useState } from "react"
import { Image, Upload, Search, Folder, File, FileImage, FileVideo, FileArchive, Plus, MoreHorizontal } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface MediaItem {
  id: string; name: string; type: string; size: string; folder: string; date: string
}

const mediaItems: MediaItem[] = [
  { id: "1", name: "hero-banner.jpg", type: "image", size: "2.4 MB", folder: "Banners", date: "2026-07-20" },
  { id: "2", name: "product-thumbnail-1.png", type: "image", size: "1.1 MB", folder: "Products", date: "2026-07-19" },
  { id: "3", name: "dashboard-preview.mp4", type: "video", size: "15.2 MB", folder: "Videos", date: "2026-07-18" },
  { id: "4", name: "template-bundle.zip", type: "archive", size: "45.0 MB", folder: "Downloads", date: "2026-07-17" },
  { id: "5", name: "logo-full.svg", type: "image", size: "245 KB", folder: "Brand", date: "2026-07-16" },
  { id: "6", name: "screenshot-2026.png", type: "image", size: "3.2 MB", folder: "Screenshots", date: "2026-07-15" },
  { id: "7", name: "promo-video.mp4", type: "video", size: "28.7 MB", folder: "Videos", date: "2026-07-14" },
  { id: "8", name: "icons-pack.zip", type: "archive", size: "8.5 MB", folder: "Downloads", date: "2026-07-13" },
  { id: "9", name: "about-team.jpg", type: "image", size: "4.8 MB", folder: "Team", date: "2026-07-12" },
  { id: "10", name: "favicon.ico", type: "image", size: "15 KB", folder: "Brand", date: "2026-07-11" },
  { id: "11", name: "product-guide.pdf", type: "document", size: "5.2 MB", folder: "Documents", date: "2026-07-10" },
  { id: "12", name: "email-template.html", type: "document", size: "85 KB", folder: "Templates", date: "2026-07-09" },
]

const folders = ["All Media", "Banners", "Products", "Videos", "Downloads", "Brand", "Screenshots", "Team", "Documents", "Templates"]

const typeIcon: Record<string, React.ReactNode> = {
  image: <FileImage className="h-8 w-8 text-blue-500" />,
  video: <FileVideo className="h-8 w-8 text-purple-500" />,
  archive: <FileArchive className="h-8 w-8 text-amber-500" />,
  document: <File className="h-8 w-8 text-red-500" />,
}

export default function MediaPage() {
  const [search, setSearch] = useState("")
  const [activeFolder, setActiveFolder] = useState("All Media")

  const filtered = mediaItems.filter((m) => {
    if (activeFolder !== "All Media" && m.folder !== activeFolder) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media Library"
        description="Manage images, documents, and downloadable files."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Media" }]}
        action={<Button><Upload className="h-4 w-4" /> Upload Files</Button>}
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

          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Drag & drop files here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Images, videos, documents up to 100MB</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="h-32 bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center relative">
                  {typeIcon[item.type] || <File className="h-8 w-8 text-muted-foreground" />}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="absolute top-2 right-2 p-1 rounded-md bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Preview</DropdownMenuItem>
                      <DropdownMenuItem>Download</DropdownMenuItem>
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.size} &middot; {item.date}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
