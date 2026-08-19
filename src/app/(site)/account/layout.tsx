import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AccountLayoutClient from "./account-layout-client"

const tabs = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/downloads", label: "Downloads" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/returns", label: "Returns" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(/\/$/, "");
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("tw_session")?.value;

  if (!convexUrl || !sessionCookie) redirect("/sign-in");

  let ok = false;
  try {
    const res = await fetch(`${convexUrl}/api/auth/me`, {
      method: "GET",
      headers: { cookie: `tw_session=${sessionCookie}` },
      cache: "no-store",
    });
    ok = res.ok;
  } catch {
    ok = false;
  }

  if (!ok) redirect("/sign-in");

  return <AccountLayoutClient tabs={tabs}>{children}</AccountLayoutClient>
}