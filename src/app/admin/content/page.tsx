"use client"

import { useState } from "react"
import { FileText, Search, Plus, Edit3, Trash2, Eye } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ContentItem {
  id: string; title: string; type: string; status: string; author: string; date: string
}

const allContent: ContentItem[] = [
  { id: "1", title: "About Us", type: "Page", status: "Published", author: "Admin", date: "2026-07-15" },
  { id: "2", title: "Privacy Policy", type: "Page", status: "Published", author: "Admin", date: "2026-07-10" },
  { id: "3", title: "Terms of Service", type: "Page", status: "Published", author: "Admin", date: "2026-07-10" },
  { id: "4", title: "Contact Us", type: "Page", status: "Published", author: "Admin", date: "2026-07-08" },
  { id: "5", title: "Getting Started with Templates", type: "Post", status: "Published", author: "Editor", date: "2026-07-20" },
  { id: "6", title: "Top 10 Dashboard Designs", type: "Post", status: "Draft", author: "Editor", date: "2026-07-18" },
  { id: "7", title: "How to Choose the Right Bundle", type: "Post", status: "Published", author: "Editor", date: "2026-07-16" },
  { id: "8", title: "UI Component Best Practices", type: "Post", status: "Draft", author: "Editor", date: "2026-07-14" },
  { id: "9", title: "E-commerce Starter Guide", type: "Resource", status: "Published", author: "Admin", date: "2026-07-12" },
  { id: "10", title: "Marketing Toolkit", type: "Resource", status: "Draft", author: "Admin", date: "2026-07-11" },
  { id: "11", title: "SEO for Digital Products", type: "Resource", status: "Published", author: "Editor", date: "2026-07-09" },
  { id: "12", title: "API Documentation", type: "Resource", status: "Published", author: "Admin", date: "2026-07-07" },
]

function ContentTable({ items, label }: { items: ContentItem[]; label: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardAction>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">{items.length} items found</span>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                <TableCell className="text-muted-foreground">{item.author}</TableCell>
                <TableCell className="text-muted-foreground">{item.date}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm"><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {items.length === 0 && (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title={`No ${label.toLowerCase()} found`}
            description="Try adjusting your search to find what you're looking for."
          />
        )}
      </CardContent>
    </Card>
  )
}

export default function ContentPage() {
  const [search, setSearch] = useState("")

  const pages = allContent.filter((c) => c.type === "Page" && (!search || c.title.toLowerCase().includes(search.toLowerCase())))
  const posts = allContent.filter((c) => c.type === "Post" && (!search || c.title.toLowerCase().includes(search.toLowerCase())))
  const resources = allContent.filter((c) => c.type === "Resource" && (!search || c.title.toLowerCase().includes(search.toLowerCase())))

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

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Pages ({pages.length})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="pages"><ContentTable items={pages} label="Pages" /></TabsContent>
          <TabsContent value="posts"><ContentTable items={posts} label="Posts" /></TabsContent>
          <TabsContent value="resources"><ContentTable items={resources} label="Resources" /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
