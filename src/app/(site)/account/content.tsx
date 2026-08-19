"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuth } from "@/lib/auth/provider";
import { api } from "@convex/_generated/api";
import { useWishlist } from "@/components/layout/wishlist-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ShoppingCart,
  Download,
  RotateCcw,
  Package,
  CreditCard,
  ArrowRight,
  KeyRound,
} from "lucide-react";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AccountOverviewContent() {
  const { user } = useAuth();
  const orders = useQuery(api.orders.listMine);
  const downloads = useQuery(api.downloads.listMine);
  const licenses = useQuery(api.licenses.listMine);
  const { totalItems } = useWishlist();

  const userInitial = (user?.name ?? "U").charAt(0).toUpperCase();
  const avatar = user?.avatar;

  const completedOrders = orders?.filter((o) => o.paymentStatus === "completed") ?? [];
  const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const latestOrder = orders?.[0];
  const now = new Date().getTime();

  const availableDownloads = (downloads ?? []).filter(
    (d) => d.status === "active" && d.remainingDownloads > 0 && d.expiresAt > now
  ).length;
  const activeLicenses = (licenses ?? []).filter((l) => l.status === "active").length;

  const stats = [
    { label: "Total Orders", value: orders?.length ?? 0, icon: ShoppingCart, href: "/account/orders" },
    { label: "Total Spent", value: fmtMoney(totalSpent), icon: CreditCard, href: "/account/orders" },
    { label: "Downloads Available", value: availableDownloads, icon: Download, href: "/account/downloads" },
    { label: "Wishlist", value: totalItems, icon: Heart, href: "/account/wishlist" },
  ];

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={user?.name ?? "Avatar"}
                  className="h-14 w-14 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                userInitial
              )}
            </div>
            <div>
              <p className="font-heading text-xl font-semibold text-primary">
                {user?.name ?? "Your Account"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.email ?? ""}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                  <KeyRound className="h-3 w-3" /> {activeLicenses} active license{activeLicenses === 1 ? "" : "s"}
                </Badge>
                <Badge variant="outline" className="gap-1 border-primary/20 text-primary">
                  <Download className="h-3 w-3" /> {availableDownloads} download{availableDownloads === 1 ? "" : "s"} ready
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {user && (
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <ShoppingCart className="h-4 w-4" /> My orders
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lifetime summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-all hover:-translate-y-0.5 hover:shadow-card">
              <CardContent className="p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
                <p className="font-heading text-2xl font-bold text-primary">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          {latestOrder && (
            <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {latestOrder ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-primary">Order {latestOrder.orderNumber}</p>
                <p className="text-xs text-muted-foreground">Placed {fmtDate(latestOrder._creationTime)}</p>
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-sm text-muted-foreground">
                  {latestOrder.items.length} item{latestOrder.items.length === 1 ? "" : "s"} · {fmtMoney(latestOrder.total)}
                </span>
                <StatusBadge status={latestOrder.orderStatus} />
                <Link
                  href={`/account/orders/${latestOrder._id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  View order <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<ShoppingCart className="h-12 w-12" />}
              title="No orders yet"
              description="Your orders and downloads will appear here after your first purchase."
              action={
                <Link href="/store">
                  <Button>
                    <ArrowRight className="h-4 w-4 mr-1" /> Browse the store
                  </Button>
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "My Orders", icon: ShoppingCart, href: "/account/orders" },
          { label: "My Downloads", icon: Download, href: "/account/downloads" },
          { label: "Refund Requests", icon: RotateCcw, href: "/account/returns" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium shadow-soft transition-all hover:bg-muted hover:border-primary/30 hover:shadow-card"
          >
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <a.icon className="h-4 w-4" />
            </span>
            <span className="font-medium text-foreground">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}