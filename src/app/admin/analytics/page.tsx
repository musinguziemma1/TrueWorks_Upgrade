"use client"

import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { BarChart3, Download, Globe, ShoppingCart, PieChart, CreditCard, ArrowUpRight, DollarSign, Package, Loader2, Eye, TrendingUp } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from "recharts"
import { formatPrice } from "@/lib/utils"
import { useState } from "react"

const COLORS = ["#0B2545", "#4A6FA5", "#C9A227", "#60A5FA", "#34D399", "#94A3B8"]
const chartConfig = { value: { label: "Value", color: "#0B2545" } }

const paymentSeg = [
  { name: "MTN MoMo", value: 60, color: "#F59E0B" },
  { name: "Airtel Money", value: 25, color: "#EF4444" },
  { name: "Card", value: 15, color: "#3B82F6" },
]

const funnelSteps = [
  { label: "Total Visitors", value: "10,000", pct: 100 },
  { label: "Product Views", value: "5,200", pct: 52 },
  { label: "Add to Cart", value: "2,100", pct: 21 },
  { label: "Checkout Initiated", value: "1,050", pct: 10.5 },
  { label: "Purchase Completed", value: "520", pct: 5.2 },
]

const trafficSeg = [
  { name: "Direct", value: 45, color: "#0B2545" },
  { name: "Search", value: 30, color: "#4A6FA5" },
  { name: "Social", value: 15, color: "#C9A227" },
  { name: "Email", value: 10, color: "#60A5FA" },
]

const deviceSeg = [
  { name: "Desktop", value: 55, icon: "Monitor" },
  { name: "Mobile", value: 35, icon: "Smartphone" },
  { name: "Tablet", value: 10, icon: "CreditCard" },
]

const ltvSegments = [
  { range: "0 - UGX 50,000", count: 320, pct: 36 },
  { range: "UGX 50,000 - UGX 200,000", count: 280, pct: 31 },
  { range: "UGX 200,000 - UGX 500,000", count: 160, pct: 18 },
  { range: "UGX 500,000 - UGX 1M", count: 80, pct: 9 },
  { range: "UGX 1M+", count: 52, pct: 6 },
]

function MetricCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend?: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
          {trend !== undefined && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xl font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("This Year")

  const summary = useQuery(api.analytics.summary)
  const products = useQuery(api.products.list, { status: "published" })
  const orders = useQuery(api.orders.list, {})

  const loading = summary === undefined || products === undefined || orders === undefined

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

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Analytics"
          description="Deep dive into your store performance, traffic, and customer behavior."
          breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Analytics" }]}
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              {["Today", "This Week", "This Month", "This Quarter", "This Year"].map((r) => (
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
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><TrendingUp className="h-5 w-5" /> Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[220px]">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}M`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="revenue" stroke="#0B2545" strokeWidth={2} dot={{ fill: "#0B2545" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><BarChart3 className="h-5 w-5" /> Orders Trend</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[220px]">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="#0B2545" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Package className="h-5 w-5" /> Product Performance</CardTitle></CardHeader>
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
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(item.totalSales / maxProductSales) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><CreditCard className="h-5 w-5" /> Payment Methods</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[280px]">
              <RePieChart>
                <Pie data={paymentSeg} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {paymentSeg.map((_, i) => <Cell key={i} fill={paymentSeg[i].color} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </RePieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><PieChart className="h-5 w-5" /> Traffic Sources</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[280px]">
              <RePieChart>
                <Pie data={trafficSeg} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {trafficSeg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </RePieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><ArrowUpRight className="h-5 w-5" /> Visitor-to-Purchase Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              {funnelSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="w-32 shrink-0 text-sm text-muted-foreground">{step.label}</div>
                  <div className="flex-1 h-10 rounded-lg bg-primary/10 flex items-center justify-between px-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-primary/20 rounded-lg" style={{ width: `${step.pct}%` }} />
                    <span className="relative z-10 text-sm font-medium">{step.value}</span>
                    <span className="relative z-10 text-xs text-muted-foreground">{step.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Globe className="h-5 w-5" /> Geographic Sales Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center relative overflow-hidden">
              <Globe className="h-12 w-12 text-primary/30" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-around text-xs text-muted-foreground">
                <span>Kampala: 42%</span>
                <span>Jinja: 18%</span>
                <span>Gulu: 12%</span>
                <span>Mbarara: 10%</span>
                <span>Others: 18%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Download className="h-5 w-5" /> Customer Lifetime Value</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {ltvSegments.map((seg) => (
                <div key={seg.range}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{seg.range}</span>
                    <span className="text-muted-foreground">{seg.count} customers ({seg.pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${seg.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
