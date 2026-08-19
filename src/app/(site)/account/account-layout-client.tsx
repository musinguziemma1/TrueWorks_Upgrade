"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/auth/provider";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useWishlist } from "@/components/layout/wishlist-context";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart, Download, Heart, RotateCcw, ShieldCheck } from "lucide-react";

interface Tab {
  href: string;
  label: string;
}

function useTabCounts() {
  const orders = useQuery(api.orders.listMine);
  const downloads = useQuery(api.downloads.listMine);
  const returns = useQuery(api.returns.listMine);
  const { totalItems } = useWishlist();
  return {
    orders: orders?.length,
    downloads: downloads?.length,
    returns: returns?.length,
    wishlist: totalItems,
  };
}

const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/account": LayoutDashboard,
  "/account/orders": ShoppingCart,
  "/account/downloads": Download,
  "/account/wishlist": Heart,
  "/account/returns": RotateCcw,
  "/account/security": ShieldCheck,
};

export default function AccountLayoutClient({
  children,
  tabs,
}: {
  children: React.ReactNode;
  tabs: Tab[];
}) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const counts = useTabCounts();
  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-primary">My Account</h1>
        {isLoaded && user && (
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {user.name ?? "there"}.
          </p>
        )}
      </div>
      <div
        className="mb-6 flex gap-1 overflow-x-auto border-b border-border pb-px"
        role="tablist"
      >
        {tabs.map((t) => {
          const active = isActive(t.href);
          const Icon = TAB_ICONS[t.href] ?? LayoutDashboard;
          const count =
            t.href === "/account/orders"
              ? counts.orders
              : t.href === "/account/downloads"
                ? counts.downloads
                : t.href === "/account/returns"
                  ? counts.returns
                  : t.href === "/account/wishlist"
                    ? counts.wishlist
                    : undefined;
          return (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={active}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {typeof count === "number" && count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                    active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}