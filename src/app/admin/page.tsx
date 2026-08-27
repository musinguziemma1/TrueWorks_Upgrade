"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  DollarSign,
  ShoppingCart,
  Package,
  CheckCircle,
  Download,
  Users,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Shield,
  Monitor,
  TrendingUp,
} from "lucide-react";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { formatPrice, cn } from "@/lib/utils";

const AdminRevenueChart = dynamic(
  () => import("@/components/admin/admin-revenue-chart").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

/** Signed % change between two values, guarding against a zero baseline. */
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

const RANGE_OPTIONS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
] as const;

type Range = (typeof RANGE_OPTIONS)[number]["days"];

export default function AdminDashboard() {
  const dash = useQuery(api.dashboard.summary);
  const [range, setRange] = useState<Range>(7);

  const orderStats = dash?.orderStats;
  const productStats = dash?.productStats;
  const recentOrders = dash?.recentOrders ?? [];
  const totalSubscribers = dash?.subscriberCount ?? 0;
  const totalDownloads = dash?.totalDownloads ?? 0;

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const revenueSeries = useMemo(
    () => [...(dash?.dailyRevenue ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [dash]
  );
  const revenueRecent7 = revenueSeries.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const prevSlice = revenueSeries.slice(-14, -7);
  const revenuePrev7 = prevSlice.reduce((s, d) => s + d.revenue, 0);
  // Only compute delta when there's a full previous period to compare against.
  const revenueDelta = prevSlice.length > 0 ? pctChange(revenueRecent7, revenuePrev7) : 0;

  const isLoading = dash === undefined;

  const revenue = orderStats?.totalRevenue ?? 0;
  const totalOrders = orderStats?.total ?? 0;
  const pendingOrders = orderStats?.pending ?? 0;
  const completedOrders = orderStats?.completed ?? 0;
  const refundedOrders = orderStats?.refunded ?? 0;
  const totalProducts = productStats?.total ?? 0;
  const publishedProducts = productStats?.published ?? 0;
  const draftProducts = productStats?.draft ?? 0;

  const rangeSeries = revenueSeries.slice(-range);
  const revenueChartData = rangeSeries.length
    ? rangeSeries.map((d) => ({ month: d.date.slice(5), revenue: d.revenue }))
    : [];

  const attentionItems = [
    {
      label: "Pending orders",
      detail: "Waiting to be processed",
      count: pendingOrders,
      href: "/admin/orders?status=pending",
      tone: "text-amber-700 bg-amber-50 border-amber-200",
      dot: "bg-amber-500",
    },
    {
      label: "Draft products",
      detail: "Not visible to customers",
      count: draftProducts,
      href: "/admin/products",
      tone: "text-blue-700 bg-blue-50 border-blue-200",
      dot: "bg-blue-500",
    },
    {
      label: "Refunds",
      detail: "Orders that were refunded",
      count: refundedOrders,
      href: "/admin/orders?payment=refunded",
      tone: "text-red-700 bg-red-50 border-red-200",
      dot: "bg-red-500",
    },
  ].filter((item) => item.count > 0);
  const hasAttention = attentionItems.length > 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description={`${today} · A live snapshot of your TrueWorks storefront.`}
        action={
          <Link
            href="/admin/analytics"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            aria-label="View analytics page"
          >
            <TrendingUp className="h-4 w-4" /> View analytics
          </Link>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
<StatCard
          label="Total Revenue"
          value={formatPrice(revenue)}
          icon={DollarSign}
          tint="text-primary bg-primary/10"
          href="/admin/analytics"
          delta={{ value: revenueDelta, label: "vs prev 7d" }}
          loading={isLoading}
        />
        <StatCard
          label="Orders"
          value={totalOrders}
          icon={ShoppingCart}
          tint="text-accent bg-accent/10"
          href="/admin/orders"
          footnote={`${completedOrders} completed`}
          loading={isLoading}
        />
        <StatCard
          label="Customers"
          value={totalSubscribers}
          icon={Users}
          tint="text-secondary bg-secondary/10"
          href="/admin/customers"
          footnote="Newsletter sign-ups"
          loading={isLoading}
        />
        <StatCard
          label="Downloads"
          value={totalDownloads}
          icon={Download}
          tint="text-slate-600 bg-slate-100"
          loading={isLoading}
        />
        <StatCard
          label="Products"
          value={totalProducts}
          icon={Package}
          tint="text-emerald-700 bg-emerald-50"
          href="/admin/products"
          footnote={`${publishedProducts} live · ${draftProducts} draft`}
          loading={isLoading}
        />
      </div>
{/* Revenue + needs attention */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="transition-shadow duration-200 hover:shadow-card lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Revenue</CardTitle>
                <CardDescription>Completed orders over the selected period</CardDescription>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setRange(opt.days)}
                    aria-pressed={range === opt.days}
                    aria-label={`${opt.label} range`}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      range === opt.days
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatPrice(revenueSeries.reduce((s, d) => s + d.revenue, 0))}
                </p>
                <p className="text-xs text-muted-foreground">total tracked revenue</p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  revenueDelta >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                )}
              >
                {revenueDelta >= 0 ? "▲" : "▼"} {Math.abs(revenueDelta).toFixed(0)}%
                <span className="font-normal text-muted-foreground">vs prev 7d</span>
              </span>
            </div>
            <AdminRevenueChart data={revenueChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Items that may need your input</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 py-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/50" />
                ))}
              </div>
            ) : hasAttention ? (
              <ul className="space-y-2.5">
                {attentionItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between gap-3 rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-soft",
                        item.tone
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("h-2.5 w-2.5 rounded-full", item.dot)} />
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs opacity-80">{item.detail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tabular-nums">{item.count}</span>
                        <ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium">You&rsquo;re all caught up</p>
                <p className="max-w-[220px] text-xs text-muted-foreground">
                  Nothing is waiting for review right now. Nice work.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
{/* Recent orders */}
      <Card className="transition-shadow duration-200 hover:shadow-card">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest 5 orders across your storefront</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary">Order</TableHead>
                <TableHead className="text-primary">Customer</TableHead>
                <TableHead className="text-right text-primary">Total</TableHead>
                <TableHead className="text-center text-primary">Payment</TableHead>
                <TableHead className="text-center text-primary">Status</TableHead>
                <TableHead className="text-right text-primary">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order) => (
                  <TableRow key={order._id} className="transition-colors hover:bg-muted/40">
                    <TableCell>
                      <Link href="/admin/orders" className="font-medium text-primary hover:underline">
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={order.orderStatus} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="h-8 w-8 opacity-40" />
                      <p>No orders yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Frequently used admin tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "Add Product", icon: ShoppingBag, href: "/admin/products/new", color: "bg-primary", aria: "Add a new product" },
              { label: "View Orders", icon: ShoppingCart, href: "/admin/orders", color: "bg-secondary", aria: "View all orders" },
              { label: "Manage Products", icon: Package, href: "/admin/products", color: "bg-accent", aria: "Manage products" },
              { label: "Customers", icon: Users, href: "/admin/customers", color: "bg-emerald-600", aria: "View customers" },
              { label: "Settings", icon: Monitor, href: "/admin/settings", color: "bg-slate-600", aria: "Open settings" },
              { label: "Auth Management", icon: Shield, href: "/admin/auth", color: "bg-red-600", aria: "Manage authentication" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                aria-label={action.aria}
                className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:bg-muted hover:border-secondary/30 hover:shadow-card"
              >
                <span className={`rounded-lg p-2 text-white ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </span>
                <span className="font-medium text-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}