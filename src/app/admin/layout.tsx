import AdminSidebar from "@/components/layout/admin-sidebar";
import AdminHeader from "@/components/layout/admin-header";
import { AdminSidebarProvider } from "@/components/layout/admin-sidebar-context";
import { AuthGate } from "@/components/auth/auth-gate";
import { requireStaff } from "@/lib/auth/server";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Server-side session check: validates the HttpOnly IAM session cookie and
  // only allows staff roles. Unauthenticated users are redirected to sign-in
  // and non-staff to the homepage before the admin UI is ever rendered.
  await requireStaff();

  return (
    <AdminSidebarProvider>
      <div className="min-h-screen bg-surface">
        <AdminSidebar />
        <div className="lg:pl-72">
          <AdminHeader />
          <main className="p-4 lg:p-6"><AuthGate>{children}</AuthGate></main>
        </div>
      </div>
    </AdminSidebarProvider>
  );
}