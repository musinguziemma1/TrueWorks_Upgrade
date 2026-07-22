import AdminSidebar from "@/components/layout/admin-sidebar"
import AdminHeader from "@/components/layout/admin-header"
import { AdminSidebarProvider } from "@/components/layout/admin-sidebar-context"

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSidebarProvider>
      <div className="min-h-screen bg-surface">
        <AdminSidebar />
        <div className="lg:pl-72">
          <AdminHeader />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AdminSidebarProvider>
  )
}
