"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  DollarSign,
  ShoppingCart,
  Package,
  CheckCircle,
  Download,
  Users,
  Mail,
  BarChart3,
  Star,
  Clock,
  ShoppingBag,
  Activity,
  Monitor,
  CalendarDays,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"

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
)

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    refunded: "bg-orange-50 text-orange-700 border-orange-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  }
  return (
    <Badge variant="outline" className={`${styles[status] || ""} font-medium capitalize`}>
      {status}
    </Badge>
  )
}

export default function AdminDashboard() {
  const { user } = useUser();

  const dash = useQuery(api.dashboard.summary)

  const orderStats = dash?.orderStats
  const productStats = dash?.productStats
  const recentOrders = dash?.recentOrders ?? []
  const totalSubscribers = dash?.subscriberCount ?? 0
  const analyticsSummary = {
    totalDownloads: dash?.totalDownloads ?? 0,
    dailyData: dash?.dailyRevenue ?? [],
  }

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [])

  const isLoading = dash === undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
      </div>
    )
  }

  const revenue = orderStats?.totalRevenue ?? 0
  const totalOrders = orderStats?.total ?? 0
  const pendingOrders = orderStats?.pending ?? 0
  const completedOrders = orderStats?.completed ?? 0
  const totalProducts = productStats?.total ?? 0
const publishedProducts = productStats?.published ?? 0

const revenueData = analyticsSummary?.dailyData?.slice(-12) ?? []
  const revenueChartData = revenueData.map((d) => ({
    month: d.date.slice(5),
    revenue: d.revenue,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545] font-heading">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground font-body flex items-center gap-2 mt-1">
            <CalendarDays className="h-4 w-4" />
            {today}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-6 rounded-xl bg-card border border-border px-5 py-3 shadow-soft">
            <div>
              <p className="text-xs text-muted-foreground font-body">Total Revenue</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">{formatPrice(revenue)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Total Orders</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">{totalOrders}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Products</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">{publishedProducts}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Subscribers</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">{totalSubscribers}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0B2545] font-heading">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-full bg-[#0B2545]/10 text-[#0B2545]">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-[#0B2545] font-heading">{formatPrice(revenue)}</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-full bg-[#3E6990]/10 text-[#3E6990]">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-[#0B2545] font-heading">{totalOrders}</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-full bg-[#C9A227]/10 text-[#C9A227]">
                  <Package className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-1">Active Products</p>
              <p className="text-3xl font-bold text-[#0B2545] font-heading">{publishedProducts}</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-1">Completed Orders</p>
              <p className="text-3xl font-bold text-[#0B2545] font-heading">{completedOrders}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0B2545] font-heading">Metric Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-full bg-amber-500/10 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-1">Pending Orders</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">{pendingOrders}</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-full bg-[#0B2545]/10 text-[#0B2545]">
                  <Star className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-1">Total Products</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">{totalProducts}</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-full bg-[#3E6990]/10 text-[#3E6990]">
                  <Download className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-1">Total Downloads</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">{analyticsSummary?.totalDownloads ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-full bg-rose-500/10 text-rose-600">
                  <Mail className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-1">Subscribers</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">{totalSubscribers}</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-full bg-[#0B2545]/10 text-[#0B2545]">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-1">Avg Order Value</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">
                {completedOrders > 0 ? formatPrice(Math.round(revenue / completedOrders)) : "$0"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-[#0B2545] font-heading">Analytics</h2>
        <Card className="transition-shadow duration-200 hover:shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0B2545]">
              <BarChart3 className="h-5 w-5 text-[#3E6990]" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminRevenueChart data={revenueChartData} />
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0B2545]">
            <ShoppingCart className="h-5 w-5 text-[#3E6990]" />
            Recent Orders
          </CardTitle>
          <CardDescription>Latest customer orders</CardDescription>
          <CardAction>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#3E6990] transition-colors hover:bg-muted"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-heading text-[#0B2545]">Order #</TableHead>
                <TableHead className="font-heading text-[#0B2545]">Customer</TableHead>
                <TableHead className="text-right font-heading text-[#0B2545]">Total</TableHead>
                <TableHead className="text-center font-heading text-[#0B2545]">Payment</TableHead>
                <TableHead className="text-center font-heading text-[#0B2545]">Status</TableHead>
                <TableHead className="text-right font-heading text-[#0B2545]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order) => (
                  <TableRow key={order._id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="font-medium text-[#0B2545]">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(order.total)}</TableCell>
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted">
                    No orders yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="transition-shadow duration-200 hover:shadow-card">
        <CardHeader>
          <CardTitle className="text-[#0B2545]">Quick Actions</CardTitle>
          <CardDescription>Frequently used admin tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "Add Product", icon: ShoppingBag, href: "/admin/products/new", color: "bg-[#0B2545]" },
              { label: "View Orders", icon: ShoppingCart, href: "/admin/orders", color: "bg-[#3E6990]" },
              { label: "Manage Products", icon: Package, href: "/admin/products", color: "bg-[#C9A227]" },
              { label: "Customers", icon: Users, href: "/admin/customers", color: "bg-emerald-600" },
              { label: "Settings", icon: Monitor, href: "/admin/settings", color: "bg-slate-600" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium shadow-soft transition-all hover:bg-muted hover:border-[#3E6990]/30 hover:shadow-card"
              >
                <span className={`p-2 rounded-lg text-white ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </span>
                <span className="font-medium text-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
