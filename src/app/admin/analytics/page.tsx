"use client"

import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { BarChart3, Download, Globe, ShoppingCart, PieChart, CreditCard, ArrowUpRight, DollarSign, Package, Loader2, Eye, TrendingUp } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend } from "recharts"
import { formatPrice } from "@/lib/utils"

const COLORS = ["#0B2545", "#4A6FA5", "#C9A227", "#60A5FA", "#34D399", "#94A3B8"]
const chartConfig = { value: { label: "Value", color: "#0B2545" } }

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-[#0B2545]/10 text-[#0B2545]">{icon}</div>
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xl font-bold text-[#0B2545]">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("This Year")

  const summary = useQuery(api.analytics.summary)
  const products = useQuery(api.products.list, { status: "published" })
  const orders = useQuery(api.orders.list, {})
  const paymentMethods = useQuery(api.orders.paymentMethodBreakdown, {})
  const ltvSegments = useQuery(api.orders.customerLtvSegments, {})

  const loading =
    summary === undefined ||
    products === undefined ||
    orders === undefined ||
    paymentMethods === undefined ||
    ltvSegments === undefined

  const productPerformance = useMemo(() => {
    if (!products || !orders) return []

    const productMap = new Map<string, { name: string; totalSales: number; totalRevenue: number }>()

    for (const product of products) {
      productMap.set(product._id, { name: product.name, totalSales: 0, totalRevenue: 0 })
    }

    for (const order of orders) {
      if (order.paymentStatus === "completed") {
        for (const item of order.items ?? []) {
          const existing = productMap.get(item.productId)
          if (existing) {
            existing.totalSales += item.quantity ?? 1
            existing.totalRevenue += item.price * (item.quantity ?? 1)
          }
        }
      }
    }

    return Array.from(productMap.values())
      .filter((p) => p.totalSales > 0)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10)
  }, [products, orders])

  const maxProductSales = useMemo(() => {
    if (productPerformance.length === 0) return 1
    return Math.max(...productPerformance.map((p) => p.totalSales))
  }, [productPerformance])

  const totalOrders = paymentMethods?.reduce((sum, p) => sum + p.value, 0) ?? 0
  const ltvTotal = ltvSegments?.reduce((sum, s) => sum + s.count, 0) ?? 0

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Analytics"
          description="Deep dive into your store performance, traffic, and customer behavior."
          breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Analytics" }]}
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
        </div>
      </div>
    )
  }

  const revenueData = (summary.dailyData ?? []).map((d) => ({
    date: d.date,
    revenue: d.revenue / 1_000_000,
    orders: d.orders,
    downloads: d.downloads,
    visitors: d.visitors,
    pageViews: d.pageViews,
  }))

  const paymentChartData = (paymentMethods ?? []).map((p, i) => ({
    name: p.name,
    value: p.value,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        description="Deep dive into your store performance, traffic, and customer behavior."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Analytics" }]}
        action={
          <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Today", "This Week", "This Month", "This Quarter", "This Year", "All Time"].map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Total Revenue" value={formatPrice(summary.totalRevenue)} />
        <MetricCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Orders" value={summary.totalOrders.toLocaleString()} />
        <MetricCard icon={<Download className="h-5 w-5" />} label="Total Downloads" value={summary.totalDownloads.toLocaleString()} />
        <MetricCard icon={<Eye className="h-5 w-5" />} label="Total Visitors" value={summary.totalVisitors.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><TrendingUp className="h-5 w-5" /> Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No revenue data yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-[220px]">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}M`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="revenue" stroke="#0B2545" strokeWidth={2} dot={{ fill: "#0B2545" }} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><BarChart3 className="h-5 w-5" /> Orders Trend</CardTitle></CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No order data yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-[220px]">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" fill="#0B2545" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><Package className="h-5 w-5" /> Product Performance</CardTitle></CardHeader>
          <CardContent>
            {productPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No completed product sales yet.</p>
            ) : (
              <div className="space-y-2.5 pt-2">
                {productPerformance.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate">{item.name}</span>
                      <span className="text-muted-foreground text-xs">{formatPrice(item.totalRevenue)}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#0B2545]" style={{ width: `${(item.totalSales / maxProductSales) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><CreditCard className="h-5 w-5" /> Payment Methods</CardTitle></CardHeader>
          <CardContent>
            {paymentChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No payment data yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-[280px]">
                <RePieChart>
                  <Pie data={paymentChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {paymentChartData.map((_, i) => <Cell key={i} fill={paymentChartData[i].color} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </RePieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><ArrowUpRight className="h-5 w-5" /> Visitor-to-Purchase Funnel</CardTitle></CardHeader>
          <CardContent>
            <FunnelChart
              steps={[
                { label: "Total Visitors", value: summary.totalVisitors, pct: 100 },
                { label: "Orders Completed", value: summary.totalOrders, pct: summary.totalVisitors > 0 ? Math.round((summary.totalOrders / summary.totalVisitors) * 100) : 0 },
                { label: "Downloads", value: summary.totalDownloads, pct: summary.totalVisitors > 0 ? Math.round((summary.totalDownloads / summary.totalVisitors) * 100) : 0 },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><Globe className="h-5 w-5" /> Geographic Sales</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Globe className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Geographic data not available.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Add a city field to orders to see regional breakdowns.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><Download className="h-5 w-5" /> Customer Lifetime Value</CardTitle></CardHeader>
          <CardContent>
            {(ltvSegments ?? []).length === 0 || ltvTotal === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No customer LTV data yet.</p>
            ) : (
              <div className="space-y-4 pt-2">
                {(ltvSegments ?? []).map((seg) => {
                  const pct = ltvTotal > 0 ? Math.round((seg.count / ltvTotal) * 100) : 0;
                  return (
                    <div key={seg.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{seg.label}</span>
                        <span className="text-muted-foreground">{seg.count} customers ({pct}%)</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#0B2545]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FunnelChart({ steps }: { steps: { label: string; value: number; pct: number }[] }) {
  return (
    <div className="space-y-3 pt-2">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-4">
          <div className="w-32 shrink-0 text-sm text-muted-foreground">{step.label}</div>
          <div className="flex-1 h-10 rounded-lg bg-[#0B2545]/10 flex items-center justify-between px-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-[#0B2545]/20 rounded-lg" style={{ width: `${step.pct}%` }} />
            <span className="relative z-10 text-sm font-medium">{step.value.toLocaleString()}</span>
            <span className="relative z-10 text-xs text-muted-foreground">{step.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
