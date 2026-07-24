"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { FileText, Search, Plus, Edit3, Trash2, Eye, Loader2 } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import type { Id } from "@convex/_generated/dataModel"

interface ContentItem {
  _id: Id<"pages">
  title: string
  type: string
  status: string
  slug: string
  createdAt: number
}

function ContentTable({ items, label, onDelete }: { items: ContentItem[]; label: string; onDelete: (id: Id<"pages">) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardAction>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">{items.length} items</span>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title={`No ${label.toLowerCase()} found`}
            description="Create your first content item to get started."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                  <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-sm"><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => onDelete(item._id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default function ContentPage() {
  const [search, setSearch] = useState("")
  const allPages = useQuery(api.pages.list, search ? { type: undefined } : {})
  const deletePage = useMutation(api.pages.remove)

  const filtered = allPages?.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase())) ?? []
  const pages = filtered.filter((c) => c.type === "page")
  const posts = filtered.filter((c) => c.type === "post")
  const resources = filtered.filter((c) => c.type === "resource")

  function handleDelete(id: Id<"pages">) {
    deletePage({ id }).then(() => toast.success("Deleted")).catch(() => toast.error("Failed to delete"))
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Content"
        description="Manage pages, posts, and resources"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Content" }]}
        action={
          <Button><Plus className="h-4 w-4" /> Add New</Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search content..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {allPages === undefined ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="pages">
          <TabsList>
            <TabsTrigger value="pages">Pages ({pages.length})</TabsTrigger>
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            <TabsContent value="pages"><ContentTable items={pages} label="Pages" onDelete={handleDelete} /></TabsContent>
            <TabsContent value="posts"><ContentTable items={posts} label="Posts" onDelete={handleDelete} /></TabsContent>
            <TabsContent value="resources"><ContentTable items={resources} label="Resources" onDelete={handleDelete} /></TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  )
}
