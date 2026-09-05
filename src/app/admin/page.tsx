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
  Sparkles,
  Mail,
  Clock,
  AlertCircle,
  BarChart3,
  Award,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
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
  const supportMessages = useQuery(api.contact.list, {});
  const [range, setRange] = useState<Range>(7);

  const orderStats = dash?.orderStats;
  const productStats = dash?.productStats;
  const recentOrders = useMemo(() => dash?.recentOrders ?? [], [dash?.recentOrders]);
  const totalCustomers = dash?.customerCount ?? 0;
  const totalDownloads = dash?.totalDownloads ?? 0;
  const activeLicenses = dash?.activeLicenses ?? 0;

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
      icon: Clock,
    },
    {
      label: "Draft products",
      detail: "Not visible to customers",
      count: draftProducts,
      href: "/admin/products",
      tone: "text-blue-700 bg-blue-50 border-blue-200",
      dot: "bg-blue-500",
      icon: FileText,
    },
    {
      label: "Refunds",
      detail: "Orders that were refunded",
      count: refundedOrders,
      href: "/admin/orders?payment=refunded",
      tone: "text-red-700 bg-red-50 border-red-200",
      dot: "bg-red-500",
      icon: AlertCircle,
    },
  ].filter((item) => item.count > 0);
  const hasAttention = attentionItems.length > 0;

  // Greeting based on local hour.
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Top-selling products from the 5 most recent orders. Lightweight, no
  // separate aggregate query.
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    for (const order of recentOrders) {
      for (const item of order.items ?? []) {
        const key = String(item.productId);
        const prev = map.get(key) ?? { name: item.productName, count: 0, revenue: 0 };
        prev.count += item.quantity;
        prev.revenue += item.quantity * item.price;
        map.set(key, prev);
      }
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [recentOrders]);

  const unreadSupportCount = useMemo(() => {
    if (!supportMessages) return 0;
    return (supportMessages as { status?: string; readAt?: number }[]).filter(
      (m) => !m.readAt,
    ).length;
  }, [supportMessages]);
  const latestSupport = useMemo(() => {
    if (!supportMessages) return [];
    return (supportMessages as Array<{ _id: string; name?: string; email?: string; subject?: string; message?: string; createdAt: number; readAt?: number }>)
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 4);
  }, [supportMessages]);

  return (
    <div className="space-y-8">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071A33] via-[#071A33] to-[#071A33] px-6 py-8 lg:px-8 lg:py-10">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-accent/[0.10] blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[24rem] w-[24rem] rounded-full bg-blue-500/[0.10] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.05] blur-3xl" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "400px 400px",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
              {greeting}, admin
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold text-white md:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              {today} · A live snapshot of your TrueWorks storefront.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 rounded-full gradient-gold px-4 py-2 text-xs font-semibold text-primary-dark shadow-md shadow-accent/20 transition-all hover:brightness-105"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New product
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Analytics
            </Link>
          </div>
        </div>

        {/* Today-at-a-glance pills */}
        <div className="relative mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Pending orders", value: pendingOrders, icon: Clock, href: "/admin/orders?status=pending", tone: "border-amber-300/30 bg-amber-400/10 text-amber-100" },
            { label: "Drafts", value: draftProducts, icon: FileText, href: "/admin/products", tone: "border-blue-300/30 bg-blue-400/10 text-blue-100" },
            { label: "Refunds", value: refundedOrders, icon: AlertCircle, href: "/admin/orders?payment=refunded", tone: "border-red-300/30 bg-red-400/10 text-red-100" },
            { label: "Active licenses", value: activeLicenses, icon: Shield, href: "/admin/licenses", tone: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100" },
            { label: "Downloads", value: totalDownloads, icon: Download, href: "/admin/downloads", tone: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100" },
            { label: "Unread support", value: unreadSupportCount, icon: Mail, href: "/admin/support", tone: "border-violet-300/30 bg-violet-400/10 text-violet-100" },
          ].map((pill) => (
            <Link
              key={pill.label}
              href={pill.href}
              className={cn(
                "group flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 backdrop-blur-sm transition-all hover:-translate-y-0.5",
                pill.tone,
              )}
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                <pill.icon className="h-3.5 w-3.5 opacity-80" />
                {pill.label}
              </span>
              <span className="text-base font-bold tabular-nums">{pill.value}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── KPI grid: featured revenue + secondary cards ────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Featured revenue card (navy) */}
        <div className="gradient-brand relative overflow-hidden rounded-2xl p-6 shadow-elevated lg:col-span-1">
          <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">
                Total Revenue
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent-light">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 font-heading text-3xl font-bold tracking-tight text-white tabular-nums sm:text-4xl">
              {isLoading ? "—" : formatPrice(revenue)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold tabular-nums",
                  revenueDelta >= 0
                    ? "bg-emerald-400/20 text-emerald-100"
                    : "bg-red-400/20 text-red-100",
                )}
              >
                {revenueDelta >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(revenueDelta).toFixed(0)}%
                <span className="font-normal opacity-80">vs prev 7d</span>
              </span>
              <span className="text-white/60">
                {completedOrders} completed orders
              </span>
            </div>
            <Link
              href="/admin/analytics"
              className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-accent-light transition-transform hover:translate-x-0.5"
            >
              View detailed analytics
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Secondary 2x2 grid */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
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
            value={totalCustomers}
            icon={Users}
            tint="text-secondary bg-secondary/10"
            href="/admin/customers"
            footnote="People who purchased"
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
          <StatCard
            label="Downloads"
            value={totalDownloads}
            icon={Download}
            tint="text-cyan-700 bg-cyan-50"
            href="/admin/downloads"
            footnote="Templates served"
            loading={isLoading}
          />
        </div>
      </div>

      {/* Revenue chart + needs attention */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="transition-shadow duration-200 hover:shadow-card lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <CardTitle>Revenue</CardTitle>
                </div>
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
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <AlertCircle className="h-4 w-4" />
              </span>
              <CardTitle>Needs attention</CardTitle>
            </div>
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
                        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-white/60", item.dot.replace("bg-", "text-"))}>
                          <item.icon className="h-4 w-4" />
                        </span>
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

      {/* Top products + Support inbox */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="transition-shadow duration-200 hover:shadow-card">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent-dark">
                    <Award className="h-4 w-4" />
                  </span>
                  <CardTitle>Top selling products</CardTitle>
                </div>
                <CardDescription>From the latest 5 orders</CardDescription>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-primary transition-colors hover:text-accent-dark"
              >
                View orders
                <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted">
                <Package className="h-7 w-7 opacity-40" />
                <p className="text-sm">No products sold yet</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {topProducts.map((p, i) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface px-3 py-2.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted">
                        {p.count} sold
                      </p>
                    </div>
                    <span className="font-heading text-sm font-bold text-primary tabular-nums">
                      {formatPrice(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow duration-200 hover:shadow-card">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                    <Mail className="h-4 w-4" />
                  </span>
                  <CardTitle>Support inbox</CardTitle>
                  {unreadSupportCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                      {unreadSupportCount} unread
                    </span>
                  )}
                </div>
                <CardDescription>Latest customer messages</CardDescription>
              </div>
              <Link
                href="/admin/support"
                className="text-xs font-semibold text-primary transition-colors hover:text-accent-dark"
              >
                Open inbox
                <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!supportMessages ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/50" />
                ))}
              </div>
            ) : latestSupport.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted">
                <Mail className="h-7 w-7 opacity-40" />
                <p className="text-sm">No support messages yet</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {latestSupport.map((m) => (
                  <li
                    key={m._id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                      m.readAt
                        ? "border-border/70 bg-white"
                        : "border-violet-200 bg-violet-50/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        m.readAt
                          ? "bg-surface text-muted"
                          : "gradient-gold text-primary-dark"
                      )}
                    >
                      {(m.name ?? m.email ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {m.name ?? m.email ?? "Anonymous"}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="truncate text-xs font-medium text-primary">
                        {m.subject ?? "No subject"}
                      </p>
                      {m.message && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                          {m.message}
                        </p>
                      )}
                    </div>
                    {!m.readAt && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="transition-shadow duration-200 hover:shadow-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <CardTitle>Recent orders</CardTitle>
              </div>
              <CardDescription>Latest 5 orders across your storefront</CardDescription>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-primary transition-colors hover:text-accent-dark"
            >
              View all
              <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
            </Link>
          </div>
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

      {/* Quick actions (navy gradient) */}
      <div className="gradient-brand relative overflow-hidden rounded-2xl p-6 shadow-elevated lg:p-8">
        <div className="texture-dots absolute inset-0 opacity-30" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-light">
              Quick actions
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-white md:text-3xl">
              Jump back in
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              The most-used admin tools, one click away.
            </p>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Add product", icon: ShoppingBag, href: "/admin/products/new", aria: "Add a new product" },
            { label: "View orders", icon: ShoppingCart, href: "/admin/orders", aria: "View all orders" },
            { label: "Products", icon: Package, href: "/admin/products", aria: "Manage products" },
            { label: "Customers", icon: Users, href: "/admin/customers", aria: "View customers" },
            { label: "Settings", icon: Monitor, href: "/admin/settings", aria: "Open settings" },
            { label: "Auth", icon: Shield, href: "/admin/auth", aria: "Manage authentication" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              aria-label={action.aria}
              className="group flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.10]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent-light transition-colors group-hover:bg-accent/30">
                <action.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-white">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}