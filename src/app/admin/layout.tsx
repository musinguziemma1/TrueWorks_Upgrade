import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { fetchQuery, fetchMutation } from "convex/nextjs"
import { api } from "@convex/_generated/api"
import AdminSidebar from "@/components/layout/admin-sidebar"
import AdminHeader from "@/components/layout/admin-header"
import { AdminSidebarProvider } from "@/components/layout/admin-sidebar-context"
import { isAdminEmail } from "@/lib/admin-emails"
import { AuthGate } from "@/components/auth/auth-gate"

function isAllowedRole(role: string | null | undefined): boolean {
  return role === "superadmin" || role === "admin" || role === "owner" || role === "editor"
}

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims, getToken } = await auth()
  if (!userId) redirect("/sign-in")

  const claimsRole =
    (sessionClaims?.metadata as { role?: string } | undefined)?.role ??
    (sessionClaims as { publicMetadata?: { role?: string } } | undefined)?.publicMetadata?.role

  const claimsEmail =
    (sessionClaims as { email?: string } | undefined)?.email ??
    (sessionClaims as { emailAddresses?: Array<{ emailAddress: string }> } | undefined)?.emailAddresses?.[0]?.emailAddress ??
    null

  let token: string | null = null
  try {
    token = await getToken({ template: "convex" })
  } catch {
    token = null
  }

  // Resolve the current Clerk user exactly once — currentUser() is a network
  // round trip and the original code called it twice (sync + seed).
  const cu = token ? await currentUser().catch(() => null) : null

  let convexRole: string | null = null
  let convexStatus: string | null = null

  if (token && cu) {
    // Run the account sync and the role/status read in parallel instead of
    // serially. getCurrentUser falls back to clerkId/email lookups, so it
    // returns the record even if syncMyAccount's tokenIdentifier patch has not
    // landed yet.
    const [, current] = await Promise.all([
      fetchMutation(
        api.users.syncMyAccount,
        {
          clerkId: cu.id,
          email: cu.emailAddresses?.[0]?.emailAddress ?? "",
          name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || undefined,
          avatar: cu.imageUrl || undefined,
        },
        { token }
      ).catch(() => null),
      fetchQuery(api.users.current, {}, { token }).catch(() => null),
    ])
    convexRole = current?.role ?? null
    convexStatus = current?.status ?? null
  }

  // Block suspended users
  if (convexStatus === "suspended") {
    redirect("/?error=suspended")
  }

  const hasAdminAccess = isAllowedRole(claimsRole) || isAllowedRole(convexRole) || isAdminEmail(claimsEmail)

  // STEP 3: If still no Convex role, try seedAdmin for new users
  if (!hasAdminAccess && token && cu) {
    try {
      await fetchMutation(
        api.users.seedAdmin,
        {
          clerkId: cu.id,
          email: cu.emailAddresses?.[0]?.emailAddress ?? "",
          name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || undefined,
          avatar: cu.imageUrl || undefined,
        },
        { token }
      )
      convexRole = "admin"
    } catch {
      // Not eligible for admin promotion
    }
  }

  const finalAdminCheck = isAllowedRole(claimsRole) || isAllowedRole(convexRole) || isAdminEmail(claimsEmail)
  if (!finalAdminCheck) redirect("/")

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
  )
}
