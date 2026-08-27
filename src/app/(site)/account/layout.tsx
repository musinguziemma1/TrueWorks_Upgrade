import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AccountLayoutClient from "./account-layout-client"

function getConvexSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return (process.env.NEXT_PUBLIC_CONVEX_URL ?? "")
    .replace(/\.convex\.cloud\/?$/, ".convex.site")
    .replace(/\/$/, "");
}

const tabs = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/downloads", label: "Downloads" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/returns", label: "Returns" },
  { href: "/account/security", label: "Security" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const convexSiteUrl = getConvexSiteUrl();
  const cookieStore = await cookies();
  // Check both cookie names: __Host-tw_session (secure, modern) and tw_session (legacy).
  const sessionCookie = cookieStore.get("__Host-tw_session")?.value ?? cookieStore.get("tw_session")?.value;

  if (!convexSiteUrl || !sessionCookie) redirect("/sign-in");

  let ok = false;
  try {
    const res = await fetch(`${convexSiteUrl}/iam/me`, {
      method: "GET",
      headers: { cookie: `__Host-tw_session=${sessionCookie}; tw_session=${sessionCookie}` },
      cache: "no-store",
    });
    ok = res.ok;
  } catch {
    ok = false;
  }

  if (!ok) redirect("/sign-in");

  return <AccountLayoutClient tabs={tabs}>{children}</AccountLayoutClient>
}