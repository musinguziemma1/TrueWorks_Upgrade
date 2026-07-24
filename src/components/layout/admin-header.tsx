"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Search,
  Bell,
  Command,
  Menu,
  Check,
  Settings,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  Mail,
  Percent,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useAdminSidebar } from "./admin-sidebar-context"
import { useSettings } from "@/lib/settings-context"
import { formatPrice } from "@/lib/utils"

const searchLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "Email Marketing", href: "/admin/email", icon: Mail },
  { label: "Coupons", href: "/admin/coupons", icon: Percent },
]

function getPageTitle(pathname: string) {
  if (pathname === "/admin") return "Dashboard"
  const segment = pathname.split("/").pop()
  if (!segment) return "Admin"
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
}

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleMobile } = useAdminSidebar()
  const [searchOpen, setSearchOpen] = useState(false)

  const notifications = useQuery(api.notifications.list, {})
  const markRead = useMutation(api.notifications.markRead)
  const settings = useSettings()

  const pageTitle = getPageTitle(pathname)
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  function timeAgo(timestamp: number) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return "Just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-white/95 px-4 backdrop-blur-md lg:px-6">
        {/* Left: mobile menu + page title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={toggleMobile}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-semibold text-muted-foreground">{settings.siteName} Admin</span>
            <span className="text-xs text-muted-foreground/70">{pageTitle}</span>
          </div>
        </div>

        {/* Center: global search trigger */}
        <Button
          variant="outline"
          className="relative h-9 w-full max-w-md justify-between rounded-lg border-border/80 bg-surface/60 px-3 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:bg-surface hover:text-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground/70" />
            <span className="hidden sm:inline">Search pages, products, orders...</span>
            <span className="sm:hidden">Search...</span>
          </span>
          <kbd className="hidden items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        {/* Right: notifications + profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <Button variant="ghost" size="xs" className="h-auto text-xs font-normal text-muted-foreground">
                  Mark all read
                </Button>
              </div>
              <DropdownMenuSeparator className="my-0" />
              <DropdownMenuGroup>
                {notifications?.slice(0, 5).map((n) => (
                  <DropdownMenuItem
                    key={n._id}
                    className="flex cursor-pointer items-start gap-3 rounded-none px-4 py-3 focus:bg-muted"
                    onClick={() => {
                      if (!n.read) markRead({ id: n._id })
                      if (n.link) router.push(n.link)
                    }}
                  >
                    <div className="mt-0.5 flex h-2 w-2 shrink-0 pt-1">
                      {!n.read ? (
                        <span className="h-2 w-2 rounded-full bg-accent" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60">{timeAgo(n.createdAt)}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-0" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="justify-center rounded-none py-2.5 text-xs font-medium text-muted-foreground focus:text-foreground"
                  onClick={() => router.push("/admin/notifications")}
                >
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-lg px-2 text-foreground outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-7 w-7" size="sm">
                <AvatarFallback className="bg-primary text-[11px] font-bold text-white">
                  TW
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-tight">Admin User</p>
                <p className="text-[10px] leading-tight text-muted-foreground">Administrator</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-xs font-bold text-white">
                    TW
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Admin User</span>
                  <span className="text-xs text-muted-foreground">Administrator</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={() => router.push("/admin/profile")}
                >
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={() => router.push("/admin/settings")}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global command palette */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search pages, products, orders..." />
        <CommandList>
          <CommandEmpty className="py-6 text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>
          <CommandGroup heading="Pages">
            {searchLinks.map((link) => {
              const Icon = link.icon
              return (
                <CommandItem
                  key={link.href}
                  onSelect={() => {
                    window.location.href = link.href
                    setSearchOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{link.label}</span>
                  <CommandShortcut>↵</CommandShortcut>
                </CommandItem>
              )
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => setSearchOpen(false)} className="cursor-pointer">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>Create product</span>
            </CommandItem>
            <CommandItem onSelect={() => setSearchOpen(false)} className="cursor-pointer">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span>Create coupon</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
