"use client"

import { useMemo, useState, useRef, useCallback } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  BarChart3, Download, Globe, ShoppingCart, CreditCard,
  ArrowUpRight, DollarSign, Package, Loader2, Eye, TrendingUp,
  FileText, Users, MousePointerClick, Map,
} from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart as RePieChart, Pie, Cell, Legend,
} from "recharts"
import dynamic from "next/dynamic"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { MetricCard } from "./_components/metric-card"
import { EventFunnel } from "./_components/event-funnel"
import { RangePicker, type DateRange } from "./_components/range-picker"
import { getDateRangeFilter, pctDelta, getPreviousRange } from "./date-range"

const MapChart = dynamic(() => import("@/components/admin/map-chart").then(m => ({ default: m.MapChart })), {
  ssr: false,
  loading: () => <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>,
})

const COLORS = ["#0B2545", "#3E6990", "#C9A227", "#60A5FA", "#34D399", "#94A3B8", "#F59E0B", "#EF4444"]
const chartConfig = {
  revenue: { label: "Revenue", color: "#0B2545" },
  orders: { label: "Orders", color: "#0B2545" },
  visitors: { label: "Visitors", color: "#3E6990" },
  pageViews: { label: "Page Views", color: "#C9A227" },
  downloads: { label: "Downloads", color: "#34D399" },
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("This Year")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [compare, setCompare] = useState(true)
  const analyticsRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const rangeLabel = dateRange === "Custom" ? `${customFrom || "..."} -> ${customTo || "..."}` : dateRange

  const filter = useMemo(() => {
    if (dateRange === "Custom" && customFrom && customTo) {
      return {
        startDate: customFrom,
        endDate: customTo,
        startTimestamp: new Date(`${customFrom}T00:00:00`).getTime(),
        endTimestamp: new Date(`${customTo}T23:59:59.999`).getTime(),
      }
    }
    return getDateRangeFilter(dateRange)
  }, [dateRange, customFrom, customTo])
  const prevFilter = useMemo(
    () => (compare ? getPreviousRange(dateRange, filter) : null),
    [compare, dateRange, filter]
  )

  const summary = useQuery(api.analytics.summary, {
    startDate: filter.startDate || undefined,
    endDate: filter.endDate || undefined,
  })
  const prevSummary = useQuery(api.analytics.summary, {
    startDate: prevFilter?.startDate || undefined,
    endDate: prevFilter?.endDate || undefined,
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
  const funnelData = useQuery(api.analyticsEvents.funnel, {
    startDate: filter.startTimestamp || undefined,
    endDate: filter.endTimestamp || undefined,
  })
  const eventOverview = useQuery(api.analyticsEvents.overview, {
    startDate: filter.startTimestamp || undefined,
    endDate: filter.endTimestamp || undefined,
  })

  const loading =
    summary === undefined ||
    prevSummary === undefined ||
    products === undefined ||
    orders === undefined ||
    paymentMethods === undefined ||
    ltvSegments === undefined ||
    geoData === undefined ||
    funnelData === undefined ||
    eventOverview === undefined

  const productPerformance = useMemo(() => {
    const productList = products?.items ?? []
    if (!productList.length || !orders) return [] as { name: string; totalSales: number; totalRevenue: number }[]
    const productMap: Record<string, { name: string; totalSales: number; totalRevenue: number }> = {}
    for (const product of productList as { _id: string; name: string }[]) {
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

  const ltvTotal = ltvSegments?.reduce((sum: number, s: { label: string; count: number }) => sum + s.count, 0) ?? 0

  const safeSummary = useMemo(() => summary ?? { totalRevenue: 0, totalOrders: 0, totalDownloads: 0, totalVisitors: 0, totalPageViews: 0, dailyData: [] }, [summary])
  const safePrev = useMemo(() => prevSummary ?? { totalRevenue: 0, totalOrders: 0, totalDownloads: 0, totalVisitors: 0, totalPageViews: 0, dailyData: [] }, [prevSummary])
  // avgOrderValue is revenue / completed orders (not all orders including failed).
  const completedOrdersCount = safeSummary.totalOrders ?? 0;
  const avgOrderValue = completedOrdersCount > 0 ? safeSummary.totalRevenue / completedOrdersCount : 0
  const conversionRate = safeSummary.totalVisitors > 0
    ? ((completedOrdersCount / safeSummary.totalVisitors) * 100).toFixed(1)
    : "0.0"
  const revenuePerVisitor = safeSummary.totalVisitors > 0
    ? formatPrice(safeSummary.totalRevenue / safeSummary.totalVisitors)
    : formatPrice(0)

  const prevOrdersCount = safePrev.totalOrders ?? 0

  const deltas = {
    revenue: pctDelta(safeSummary.totalRevenue, safePrev.totalRevenue),
    orders: pctDelta(completedOrdersCount, prevOrdersCount),
    downloads: pctDelta(safeSummary.totalDownloads, safePrev.totalDownloads),
    visitors: pctDelta(safeSummary.totalVisitors, safePrev.totalVisitors),
    pageViews: pctDelta(safeSummary.totalPageViews, safePrev.totalPageViews),
  }

  const revenueData = useMemo(() => {
    return (safeSummary.dailyData ?? []).map((d: { date: string; revenue: number; orders: number; downloads: number; visitors: number; pageViews: number }) => ({
      date: d.date,
      revenue: d.revenue,
      orders: d.orders,
      downloads: d.downloads,
      visitors: d.visitors,
      pageViews: d.pageViews,
    }))
  }, [safeSummary.dailyData])

  const spark = useMemo(() => {
    return {
      revenue: revenueData.map((d) => d.revenue),
      orders: revenueData.map((d) => d.orders),
      downloads: revenueData.map((d) => d.downloads),
      visitors: revenueData.map((d) => d.visitors),
      pageViews: revenueData.map((d) => d.pageViews),
    }
  }, [revenueData])

  const paymentChartData = useMemo(() => {
    return (paymentMethods ?? []).map((p: { name: string; value: number }, i: number) => ({
      name: p.name,
      value: p.value,
      color: COLORS[i % COLORS.length],
    }))
  }, [paymentMethods])

  const geoChartData = useMemo(() => {
    return (geoData ?? []).map((g: { country: string; orders: number; revenue: number; regions?: { name: string; count: number }[]; cities?: { name: string; count: number }[] }) => ({
      country: g.country,
      orders: g.orders,
      revenue: g.revenue,
      regions: g.regions,
      cities: g.cities,
    }))
  }, [geoData])

  const handleExportPdf = useCallback(async () => {
    setExporting(true)
    try {
      const { jsPDF } = await import("jspdf")
      const pdf = new jsPDF("p", "mm", "a4")
      const W = 210
      const MARGIN = 14
      const maxY = 292
      let y = 24

      const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 })
      const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
      const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}...` : s)

      const ensure = (needed: number) => {
        if (y + needed > maxY) {
          pdf.addPage()
          y = MARGIN
        }
      }

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(18)
      pdf.setTextColor("#0B2545")
      pdf.text("TrueWorks Analytics Report", MARGIN, 16)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(9)
      pdf.setTextColor(120)
      pdf.text(`Range: ${rangeLabel}   |   Generated: ${new Date().toLocaleDateString("en-UG")}`, MARGIN, 21)

      const section = (title: string) => {
        ensure(12)
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(11)
        pdf.setTextColor("#0B2545")
        pdf.text(title, MARGIN, y)
        pdf.setDrawColor("#0B2545")
        pdf.setLineWidth(0.3)
        pdf.line(MARGIN, y + 1.5, W - MARGIN, y + 1.5)
        y += 6
      }

      const kvRow = (label: string, value: string) => {
        ensure(7)
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(9)
        pdf.setTextColor(90)
        pdf.text(label, MARGIN, y)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(20)
        pdf.text(value, W - MARGIN, y, { align: "right" })
        y += 5.5
      }

      const table = (headers: string[], rows: (string | number)[][]) => {
        if (rows.length === 0) {
          ensure(6)
          pdf.setFont("helvetica", "italic")
          pdf.setFontSize(9)
          pdf.setTextColor(130)
          pdf.text("No data for this range.", MARGIN + 2, y)
          y += 6
          return
        }
        const colW = (W - MARGIN * 2) / headers.length
        const colX = headers.map((_, i) => MARGIN + i * colW)
        ensure(8)
        pdf.setFillColor("#0B2545")
        pdf.rect(MARGIN, y - 4.5, W - MARGIN * 2, 6.5, "F")
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(8.5)
        pdf.setTextColor("#ffffff")
        headers.forEach((h, i) => pdf.text(h, colX[i] + 2, y, { maxWidth: colW - 4 }))
        y += 7
        rows.forEach((row, ri) => {
          ensure(6)
          if (ri % 2 === 1) {
            pdf.setFillColor(245, 248, 250)
            pdf.rect(MARGIN, y - 4, W - MARGIN * 2, 5, "F")
          }
          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(8)
          pdf.setTextColor(40)
          row.forEach((cell, ci) => {
            pdf.text(String(cell), colX[ci] + 2, y, { maxWidth: colW - 4 })
          })
          y += 5
        })
        y += 3
      }

      section("Key Metrics")
      kvRow("Total Revenue", money(safeSummary.totalRevenue))
      kvRow("Total Orders", fmt(completedOrdersCount))
      kvRow("Downloads", fmt(safeSummary.totalDownloads))
      kvRow("Visitors", fmt(safeSummary.totalVisitors))
      kvRow("Page Views", fmt(safeSummary.totalPageViews))
      kvRow("Conversion Rate", `${conversionRate}%`)
      kvRow("Avg Order Value", money(avgOrderValue))
      kvRow("Revenue / Visitor", revenuePerVisitor)
      y += 2

      section("Daily Revenue Trend")
      table(
        ["Date", "Revenue", "Orders", "Downloads", "Visitors", "Page Views"],
        revenueData.map((d) => [d.date, money(d.revenue), d.orders, d.downloads, d.visitors, d.pageViews])
      )

      section("Top Products")
      table(
        ["Product", "Sales", "Revenue"],
        productPerformance.map((p) => [clip(p.name, 40), fmt(p.totalSales), money(p.totalRevenue)])
      )

      section("Payment Methods")
      table(
        ["Method", "Orders"],
        paymentChartData.map((p) => [p.name, fmt(p.value)])
      )

      section("Geographic Sales")
      table(
        ["Country", "Orders", "Revenue"],
        geoChartData.map((g) => [clip(g.country, 30), fmt(g.orders), money(g.revenue)])
      )

      section("Conversion Funnel")
      table(
        ["Step", "Count"],
        (funnelData?.funnel ?? []).map((s) => [s.name.replace(/_/g, " "), fmt(s.count)])
      )

      section("Customer Lifetime Value")
      table(
        ["Segment", "Customers"],
        (ltvSegments ?? []).map((s) => [s.label, fmt(s.count)])
      )

      pdf.save(`TrueWorks-Analytics-${rangeLabel.replace(/[^\w-]+/g, "-")}.pdf`)
      toast.success("PDF exported successfully")
    } catch (err) {
      console.error("PDF export failed:", err)
      toast.error("Failed to export PDF. Please try again.")
    } finally {
      setExporting(false)
    }
  }, [rangeLabel, safeSummary, completedOrdersCount, conversionRate, avgOrderValue, revenuePerVisitor, revenueData, productPerformance, paymentChartData, geoChartData, funnelData, ltvSegments])

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
          <div className="flex flex-wrap items-center gap-2">
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
            />
            <Button
              variant="outline"
              size="sm"
              className={compare ? "border-[#0B2545] text-[#0B2545]" : ""}
              onClick={() => setCompare((c) => !c)}
              aria-pressed={compare}
            >
              {compare ? <TrendingUp className="h-4 w-4 mr-1" /> : <ArrowUpRight className="h-4 w-4 mr-1" />}
              Compare
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting}
              aria-label="Export analytics report as PDF"
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
          <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Total Revenue" value={formatPrice(safeSummary.totalRevenue)} delta={deltas.revenue} spark={spark.revenue} />
          <MetricCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Orders" value={completedOrdersCount.toLocaleString()} delta={deltas.orders} spark={spark.orders} />
          <MetricCard icon={<Download className="h-5 w-5" />} label="Downloads" value={safeSummary.totalDownloads.toLocaleString()} delta={deltas.downloads} spark={spark.downloads} />
          <MetricCard icon={<Eye className="h-5 w-5" />} label="Visitors" value={safeSummary.totalVisitors.toLocaleString()} delta={deltas.visitors} spark={spark.visitors} />
          <MetricCard icon={<MousePointerClick className="h-5 w-5" />} label="Page Views" value={safeSummary.totalPageViews.toLocaleString()} delta={deltas.pageViews} spark={spark.pageViews} />
          <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="Conv. Rate" value={`${conversionRate}%`} sub={`${formatPrice(avgOrderValue)} avg order`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Avg Order Value" value={formatPrice(avgOrderValue)} />
          <MetricCard icon={<ArrowUpRight className="h-5 w-5" />} label="Revenue / Visitor" value={revenuePerVisitor} />
          <MetricCard icon={<Package className="h-5 w-5" />} label="Products Sold" value={productPerformance.reduce((s, p) => s + p.totalSales, 0).toLocaleString()} />
          <MetricCard icon={<Users className="h-5 w-5" />} label="Refunds" value={((orders as { paymentStatus: string }[])?.filter((o) => o.paymentStatus === "refunded") ?? []).length.toLocaleString()} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EE" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}`} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EE" />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EE" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="visitors" stroke="#3E6990" strokeWidth={2} dot={{ fill: "#3E6990" }} name="Visitors" />
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
            <CardHeader><CardTitle className="flex items-center gap-2 text-[#0B2545]"><ArrowUpRight className="h-5 w-5" /> Conversion Funnel</CardTitle></CardHeader>
            <CardContent>
              <EventFunnel funnel={funnelData?.funnel ?? []} />
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
                  <p className="text-xs text-muted-foreground/70 mt-1">Customer billing addresses and IP data will show regional and city breakdowns here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <MapChart data={geoChartData} />
                  <div className="space-y-2 pt-2 border-t">
                    {geoChartData.map((g) => (
                      <div key={g.country}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Map className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{g.country}</span>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span>{g.orders} order{g.orders !== 1 ? "s" : ""}</span>
                            <span className="font-medium text-foreground">{formatPrice(g.revenue)}</span>
                          </div>
                        </div>
                        {g.regions && g.regions.length > 0 && (
                          <div className="ml-6 mt-1 space-y-0.5">
                            {g.regions.slice(0, 3).map((r) => (
                              <div key={r.name} className="text-xs text-muted-foreground/70">
                                {r.name}: {r.count} order{r.count !== 1 ? "s" : ""}
                              </div>
                            ))}
                          </div>
                        )}
                        {g.cities && g.cities.length > 0 && (
                          <div className="ml-6 mt-1 space-y-0.5">
                            {g.cities.slice(0, 4).map((c) => (
                              <div key={c.name} className="text-xs text-muted-foreground/70">
                                {c.name}: {c.count} order{c.count !== 1 ? "s" : ""}
                              </div>
                            ))}
                          </div>
                        )}
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
