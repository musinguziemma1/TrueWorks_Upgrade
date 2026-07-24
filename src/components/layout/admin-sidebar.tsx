"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Download,
  FolderTree,
  Percent,
  FileText,
  Image,
  Mail,
  BarChart3,
  Wallet,
  FileBarChart,
  Shield,
  Settings,
  Bell,
  LifeBuoy,
  GraduationCap,
  Briefcase,
  UserCheck,
  X,
  ChevronRight,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { useAdminSidebar } from "./admin-sidebar-context"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Products", href: "/admin/products", icon: <Package className="h-4 w-4" /> },
      { label: "Orders", href: "/admin/orders", icon: <ShoppingCart className="h-4 w-4" /> },
      { label: "Customers", href: "/admin/customers", icon: <Users className="h-4 w-4" /> },
      { label: "Downloads", href: "/admin/downloads", icon: <Download className="h-4 w-4" /> },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Categories", href: "/admin/categories", icon: <FolderTree className="h-4 w-4" /> },
      { label: "Resources", href: "/admin/resources", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Coupons", href: "/admin/coupons", icon: <Percent className="h-4 w-4" /> },
      { label: "Content", href: "/admin/content", icon: <FileText className="h-4 w-4" /> },
      { label: "Media", href: "/admin/media", icon: <Image className="h-4 w-4" /> },
      { label: "Email Marketing", href: "/admin/email", icon: <Mail className="h-4 w-4" /> },
    ],
  },
  {
    title: "Data",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Payments", href: "/admin/payments", icon: <Wallet className="h-4 w-4" /> },
      { label: "Reports", href: "/admin/reports", icon: <FileBarChart className="h-4 w-4" /> },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: <Shield className="h-4 w-4" /> },
      { label: "Settings", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
      { label: "Notifications", href: "/admin/notifications", icon: <Bell className="h-4 w-4" /> },
      { label: "Support", href: "/admin/support", icon: <LifeBuoy className="h-4 w-4" /> },
    ],
  },
  {
    title: "Future",
    items: [
      { label: "Academy", href: "/admin/academy", icon: <GraduationCap className="h-4 w-4" />, badge: "Coming Soon" },
      { label: "Consulting", href: "/admin/consulting", icon: <Briefcase className="h-4 w-4" />, badge: "Coming Soon" },
      { label: "Memberships", href: "/admin/memberships", icon: <UserCheck className="h-4 w-4" />, badge: "Coming Soon" },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { mobileOpen, setMobileOpen } = useAdminSidebar()

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-[#0B2545] transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Link
            href="/admin"
            className="flex items-center transition-opacity hover:opacity-90"
            onClick={() => setMobileOpen(false)}
          >
            <Logo variant="horizontal-white" width={150} height={36} />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          <div className="space-y-6">
            {navSections.map((section, sectionIndex) => (
              <div key={section.title}>
                {sectionIndex > 0 && (
                  <div className="mb-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                )}
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href)
                    const comingSoon = item.badge === "Coming Soon"

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          aria-disabled={comingSoon}
                          tabIndex={comingSoon ? -1 : undefined}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
                            active
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                            comingSoon && "pointer-events-none opacity-80"
                          )}
                        >
                          {active && (
                            <span
                              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#C9A227]"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={cn(
                              "shrink-0 transition-colors duration-200",
                              active ? "text-[#D4B33A]" : "text-white/50 group-hover:text-white/80"
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-auto shrink-0 border px-1.5 py-0 text-[10px] font-medium",
                                comingSoon
                                  ? "border-[#C9A227]/40 text-[#C9A227] bg-[#C9A227]/10"
                                  : "border-white/20 text-white/80 bg-white/5"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {active && (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/40" />
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* User mini profile */}
        <div className="shrink-0 border-t border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A227]/30 to-[#C9A227]/10 ring-1 ring-white/10">
              <span className="text-xs font-bold text-white">TW</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">Admin User</p>
              <p className="truncate text-xs text-white/40">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
