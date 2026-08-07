import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import AccountLayoutClient from "./account-layout-client"

const tabs = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/downloads", label: "Downloads" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/returns", label: "Returns" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return <AccountLayoutClient tabs={tabs}>{children}</AccountLayoutClient>
}
