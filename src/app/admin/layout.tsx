import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/admin-sidebar";
import AdminHeader from "@/components/layout/admin-header";
import { AdminSidebarProvider } from "@/components/layout/admin-sidebar-context";
import { AuthGate } from "@/components/auth/auth-gate";

const ALLOWED_ROLES = ["superadmin", "admin", "owner", "editor"];

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.replace(/\/$/, "");
  if (!convexSiteUrl) redirect("/");

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("tw_session")?.value;

  // Server-side session check: forward the HttpOnly session cookie to the IAM
  // /me endpoint. If there is no valid session (or the role isn't staff), the
  // request never reaches the admin UI.
  if (!sessionCookie) redirect("/sign-in");

  let role = "";
  try {
    const res = await fetch(`${convexSiteUrl}/iam/me`, {
      method: "GET",
      headers: { cookie: `tw_session=${sessionCookie}` },
      cache: "no-store",
    });
    if (!res.ok) redirect("/sign-in");
    const data = await res.json();
    role = data?.user?.role ?? "";
  } catch {
    redirect("/sign-in");
  }

  if (!ALLOWED_ROLES.includes(role)) redirect("/");

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