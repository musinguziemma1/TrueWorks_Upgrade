"use client"

import { useMemo, useState, useRef, useCallback } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  BarChart3, Download, Globe, ShoppingCart, PieChart, CreditCard,
  ArrowUpRight, DollarSign, Package, Loader2, Eye, TrendingUp,
  FileText, Users, MousePointerClick, Map,
} from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart as RePieChart, Pie, Cell, Legend,
} from "recharts"
import { formatPrice } from "@/lib/utils"

const COLORS = ["#0B2545", "#4A6FA5", "#C9A227", "#60A5FA", "#34D399", "#94A3B8", "#F59E0B", "#EF4444"]
const chartConfig = { value: { label: "Value", color: "#0B2545" } }

function getDateRangeFilter(range: string) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  let startDate = ""
  let startTimestamp = 0

  switch (range) {
    case "Today":
      startDate = today
      startTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      break
    case "This Week": {
      const day = now.getDay()
      const diff = now.getDate() - day
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff)
      startDate = weekStart.toISOString().slice(0, 10)
      startTimestamp = weekStart.getTime()
      break
    }
    case "This Month":
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
      startTimestamp = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
      break
    case "This Quarter": {
      const qStart = Math.floor(now.getMonth() / 3) * 3
      startDate = `${now.getFullYear()}-${String(qStart + 1).padStart(2, "0")}-01`
      startTimestamp = new Date(now.getFullYear(), qStart, 1).getTime()
      break
    }
    case "This Year":
      startDate = `${now.getFullYear()}-01-01`
      startTimestamp = new Date(now.getFullYear(), 0, 1).getTime()
      break
    default:
      startDate = ""
      startTimestamp = 0
  }

  return { startDate, endDate: today, startTimestamp, endTimestamp: now.getTime() }
}

function MetricCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-[#0B2545]/10 text-[#0B2545]">{icon}</div>
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xl font-bold text-[#0B2545]">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("This Year")
  const analyticsRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const filter = useMemo(() => getDateRangeFilter(dateRange), [dateRange])

  const summary = useQuery(api.analytics.summary, {
    startDate: filter.startDate || undefined,
    endDate: filter.endDate || undefined,
  })
  const products = useQuery(api.products.list, { status: "published" })
  const orders = useQuery(api.orders.list, {
    startDate: filter.startTimestamp || undefined,
    endDate: filter.endTimestamp || undefined,
  })
  const paymentMethods = useQuery(api.orders.paymentMethodBreakdown, {
    startDate: filter.startTimestamp || undefined,
    endDate: filter.endTimestamp || undefined,
  })
  const ltvSegments = useQuery(api.orders.customerLtvSegments, {})
  const geoData = useQuery(api.orders.geoBreakdown, {
    startDate: filter.startTimestamp || undefined,
    endDate: filter.endTimestamp || undefined,
  })

  const loading =
    summary === undefined ||
    products === undefined ||
    orders === undefined ||
    paymentMethods === undefined ||
    ltvSegments === undefined ||
    geoData === undefined

  const productPerformance = useMemo(() => {
    if (!products || !orders) return [] as { name: string; totalSales: number; totalRevenue: number }[]
    const productMap: Record<string, { name: string; totalSales: number; totalRevenue: number }> = {}
    for (const product of products as { _id: string; name: string }[]) {
      productMap[product._id] = { name: product.name, totalSales: 0, totalRevenue: 0 }
    }
    for (const order of orders as { paymentStatus: string; items: { productId: string; quantity: number; price: number }[] }[]) {
      if (order.paymentStatus === "completed") {
        for (const item of order.items ?? []) {
          const existing = productMap[item.productId]
          if (existing) {
            existing.totalSales += item.quantity ?? 1
            existing.totalRevenue += item.price * (item.quantity ?? 1)
          }
        }
      }
    }
    return Object.values(productMap)
      .filter((p) => p.totalSales > 0)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10)
  }, [products, orders])

  const maxProductSales = useMemo(() => {
    if (productPerformance.length === 0) return 1
    return Math.max(...productPerformance.map((p) => p.totalSales))
  }, [productPerformance])

  const totalOrdersCount = paymentMethods?.reduce((sum: number, p: { name: string; value: number }) => sum + p.value, 0) ?? 0
  const ltvTotal = ltvSegments?.reduce((sum: number, s: { label: string; count: number }) => sum + s.count, 0) ?? 0

  const safeSummary = summary ?? { totalRevenue: 0, totalOrders: 0, totalDownloads: 0, totalVisitors: 0, totalPageViews: 0, dailyData: [] }
  const avgOrderValue = totalOrdersCount > 0 ? safeSummary.totalRevenue / totalOrdersCount : 0
  const conversionRate = safeSummary.totalVisitors > 0
    ? ((totalOrdersCount / safeSummary.totalVisitors) * 100).toFixed(1)
    : "0.0"
  const revenuePerVisitor = safeSummary.totalVisitors > 0
    ? formatPrice(safeSummary.totalRevenue / safeSummary.totalVisitors)
    : formatPrice(0)

  const revenueData = useMemo(() => {
    return (safeSummary.dailyData ?? []).map((d: { date: string; revenue: number; orders: number; downloads: number; visitors: number; pageViews: number }) => ({
      date: d.date,
      revenue: d.revenue / 1_000_000,
      orders: d.orders,
      downloads: d.downloads,
      visitors: d.visitors,
      pageViews: d.pageViews,
    }))
  }, [safeSummary.dailyData])

  const paymentChartData = useMemo(() => {
    return (paymentMethods ?? []).map((p: { name: string; value: number }, i: number) => ({
      name: p.name,
      value: p.value,
      color: COLORS[i % COLORS.length],
    }))
  }, [paymentMethods])

  const geoChartData = useMemo(() => {
    return (geoData ?? []).map((g: { country: string; orders: number; revenue: number }, i: number) => ({
      country: g.country,
      orders: g.orders,
      revenue: g.revenue / 1_000_000,
      fill: COLORS[i % COLORS.length],
    }))
  }, [geoData])

  const handleExportPdf = useCallback(async () => {
    if (!analyticsRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      const element = analyticsRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f8fafc",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF("p", "mm", "a4")

      const pageHeight = 297
      let position = 0

      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("TrueWorks Analytics Report", 105, 15, { align: "center" })
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Date Range: ${dateRange} | Generated: ${new Date().toLocaleDateString("en-UG")}`, 105, 22, { align: "center" })

      position = 28

      if (imgHeight <= pageHeight - position) {
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight)
      } else {
        let remainingHeight = imgHeight
        while (remainingHeight > 0) {
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight)
          remainingHeight -= pageHeight
          position = -(imgHeight - remainingHeight)
          if (remainingHeight > 0) pdf.addPage()
        }
      }

      pdf.save(`TrueWorks-Analytics-${dateRange.replace(/\s+/g, "-")}.pdf`)
    } catch (err) {
      console.error("PDF export failed:", err)
    } finally {
      setExporting(false)
    }
  }, [dateRange])

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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        description="Deep dive into your store performance, traffic, and customer behavior."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Analytics" }]}
        action={
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Today", "This Week", "This Month", "This Quarter", "This Year", "All Time"].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <FileText className="h-4 w-4 mr-1" />
              )}
              Export PDF
            </Button>
          </div>
        }
      />

      <div ref={analyticsRef} className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Total Revenue" value={formatPrice(safeSummary.totalRevenue)} />
          <MetricCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Orders" value={totalOrdersCount.toLocaleString()} />
          <MetricCard icon={<Download className="h-5 w-5" />} label="Downloads" value={safeSummary.totalDownloads.toLocaleString()} />
          <MetricCard icon={<Eye className="h-5 w-5" />} label="Visitors" value={safeSummary.totalVisitors.toLocaleString()} />
          <MetricCard icon={<MousePointerClick className="h-5 w-5" />} label="Page Views" value={safeSummary.totalPageViews.toLocaleString()} />
          <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="Conv. Rate" value={`${conversionRate}%`} sub={`${formatPrice(avgOrderValue)} avg order`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Avg Order Value" value={formatPrice(avgOrderValue)} />
          <MetricCard icon={<ArrowUpRight className="h-5 w-5" />} label="Revenue / Visitor" value={revenuePerVisitor} />
          <MetricCard icon={<Package className="h-5 w-5" />} label="Products Sold" value={productPerformance.reduce((s, p) => s + p.totalSales, 0).toLocaleString()} />
          <MetricCard icon={<Users className="h-5 w-5" />} label="Unique Visitors" value={safeSummary.totalVisitors.toLocaleString()} />
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
            <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><Eye className="h-5 w-5" /> Traffic Trend</CardTitle></CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No traffic data yet.</p>
              ) : (
                <ChartContainer config={chartConfig} className="aspect-auto h-[220px]">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="visitors" stroke="#4A6FA5" strokeWidth={2} dot={{ fill: "#4A6FA5" }} name="Visitors" />
                    <Line type="monotone" dataKey="pageViews" stroke="#C9A227" strokeWidth={2} dot={{ fill: "#C9A227" }} name="Page Views" />
                  </LineChart>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  { label: "Total Visitors", value: safeSummary.totalVisitors, pct: 100 },
                  { label: "Orders Completed", value: totalOrdersCount, pct: safeSummary.totalVisitors > 0 ? Math.round((totalOrdersCount / safeSummary.totalVisitors) * 100) : 0 },
                  { label: "Downloads", value: safeSummary.totalDownloads, pct: safeSummary.totalVisitors > 0 ? Math.round((safeSummary.totalDownloads / safeSummary.totalVisitors) * 100) : 0 },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><Globe className="h-5 w-5" /> Geographic Sales</CardTitle></CardHeader>
            <CardContent>
              {geoChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Globe className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No geographic data yet.</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Orders with IP data will show regional breakdowns here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ChartContainer config={chartConfig} className="aspect-auto h-[220px]">
                    <BarChart data={geoChartData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="country" tick={{ fontSize: 12 }} width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="orders" fill="#0B2545" radius={[0, 4, 4, 0]} name="Orders" />
                    </BarChart>
                  </ChartContainer>
                  <div className="space-y-2 pt-2 border-t">
                    {geoChartData.map((g) => (
                      <div key={g.country} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Map className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{g.country}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{g.orders} orders</span>
                          <span className="font-medium text-foreground">{formatPrice(g.revenue * 1_000_000)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
