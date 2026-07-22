"use client"

import { useState } from "react"
import { Shield, Plus, Search, Edit3, Trash2 } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface User {
  id: string; name: string; email: string; role: string; status: string; lastLogin: string; avatar: string
}

const users: User[] = [
  { id: "1", name: "Admin User", email: "admin@trueworks.com", role: "Admin", status: "Active", lastLogin: "2026-07-20 09:30", avatar: "AU" },
  { id: "2", name: "Sarah Manager", email: "sarah@trueworks.com", role: "Store Manager", status: "Active", lastLogin: "2026-07-20 08:15", avatar: "SM" },
  { id: "3", name: "John Editor", email: "john@trueworks.com", role: "Content Editor", status: "Active", lastLogin: "2026-07-19 14:45", avatar: "JE" },
  { id: "4", name: "Grace Marketing", email: "grace@trueworks.com", role: "Marketing", status: "Active", lastLogin: "2026-07-19 11:20", avatar: "GM" },
  { id: "5", name: "David Support", email: "david@trueworks.com", role: "Support", status: "Active", lastLogin: "2026-07-18 16:00", avatar: "DS" },
  { id: "6", name: "Alice Finance", email: "alice@trueworks.com", role: "Finance", status: "Inactive", lastLogin: "2026-07-10 10:30", avatar: "AF" },
  { id: "7", name: "Peter Contributor", email: "peter@trueworks.com", role: "Content Editor", status: "Active", lastLogin: "2026-07-17 09:00", avatar: "PC" },
]

const roles = ["Admin", "Store Manager", "Content Editor", "Marketing", "Support", "Finance"]

function roleBadge(role: string) {
  const colors: Record<string, string> = {
    Admin: "bg-purple-100 text-purple-800 border-purple-200",
    "Store Manager": "bg-blue-100 text-blue-800 border-blue-200",
    "Content Editor": "bg-green-100 text-green-800 border-green-200",
    Marketing: "bg-amber-100 text-amber-800 border-amber-200",
    Support: "bg-cyan-100 text-cyan-800 border-cyan-200",
    Finance: "bg-rose-100 text-rose-800 border-rose-200",
  }
  return <Badge variant="outline" className={colors[role] || ""}>{role}</Badge>
}

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 8

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users & Roles"
        description="Manage admin users and their permissions"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Users & Roles" }]}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button><Plus className="h-4 w-4" /> Add User</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Enter full name" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@example.com" /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" placeholder="Enter password" /></div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter showCloseButton>
                <Button onClick={() => setDialogOpen(false)}>Add User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardAction>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{filtered.length} users found</span>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{u.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{u.lastLogin}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm"><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<Shield className="h-12 w-12" />}
              title="No users found"
              description="Try adjusting your search to find what you're looking for."
            />
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
