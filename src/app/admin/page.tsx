"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  CheckCircle,
  Download,
  Users,
  Mail,
  Percent,
  BarChart3,
  Star,
  Clock,
  ShoppingBag,
  CreditCard,
  PieChart,
  Activity,
  Monitor,
  CalendarDays,
  FileDown,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts"

const salesTrendData = [
  { month: "Jan", sales: 28 }, { month: "Feb", sales: 35 }, { month: "Mar", sales: 42 },
  { month: "Apr", sales: 38 }, { month: "May", sales: 52 }, { month: "Jun", sales: 48 },
  { month: "Jul", sales: 58 }, { month: "Aug", sales: 55 }, { month: "Sep", sales: 62 },
  { month: "Oct", sales: 70 }, { month: "Nov", sales: 65 }, { month: "Dec", sales: 78 },
]

const monthlyRevenueData = [
  { month: "Jan", revenue: 4.2 }, { month: "Feb", revenue: 3.8 }, { month: "Mar", revenue: 5.1 },
  { month: "Apr", revenue: 4.5 }, { month: "May", revenue: 6.2 }, { month: "Jun", revenue: 5.8 },
  { month: "Jul", revenue: 7.1 }, { month: "Aug", revenue: 6.5 }, { month: "Sep", revenue: 5.9 },
  { month: "Oct", revenue: 8.2 }, { month: "Nov", revenue: 7.4 }, { month: "Dec", revenue: 9.0 },
]

const productPerformanceData = [
  { name: "Business Template Pro", value: 85 },
  { name: "Admin Dashboard Kit", value: 72 },
  { name: "E-commerce Bundle", value: 68 },
  { name: "UI Component Pack", value: 55 },
  { name: "Marketing Suite", value: 42 },
]

const downloadsData = [
  { name: "Business Template Pro", value: 35 },
  { name: "Admin Dashboard Kit", value: 25 },
  { name: "E-commerce Bundle", value: 20 },
  { name: "UI Component Pack", value: 12 },
  { name: "Others", value: 8 },
]

const trafficData = [
  { name: "Direct", value: 45 },
  { name: "Search", value: 30 },
  { name: "Social", value: 15 },
  { name: "Email", value: 10 },
]

const deviceData = [
  { name: "Desktop", value: 55 },
  { name: "Mobile", value: 35 },
  { name: "Tablet", value: 10 },
]

const paymentData = [
  { name: "MTN MoMo", value: 60 },
  { name: "Airtel Money", value: 25 },
  { name: "Card", value: 15 },
]

const COLORS = ["#0B2545", "#4A6FA5", "#C9A227", "#60A5FA", "#94A3B8"]
const PIE_COLORS = ["#0B2545", "#4A6FA5", "#C9A227"]

const chartConfig = {
  sales: { label: "Sales", color: "#0B2545" },
  revenue: { label: "Revenue (UGX M)", color: "#0B2545" },
  value: { label: "Score", color: "#4A6FA5" },
  desktop: { label: "Desktop", color: "#0B2545" },
  mobile: { label: "Mobile", color: "#4A6FA5" },
  tablet: { label: "Tablet", color: "#C9A227" },
}

const priorityKpis = [
  {
    icon: DollarSign,
    label: "Total Revenue",
    value: "UGX 45,230,000",
    trend: 12.5,
    color: "bg-[#0B2545]/10 text-[#0B2545]",
    sparkline: true,
  },
  {
    icon: ShoppingCart,
    label: "Total Orders",
    value: "1,247",
    trend: 5.7,
    color: "bg-[#4A6FA5]/10 text-[#4A6FA5]",
  },
  {
    icon: Users,
    label: "Active Customers",
    value: "892",
    trend: 11.2,
    color: "bg-[#C9A227]/10 text-[#C9A227]",
  },
  {
    icon: Percent,
    label: "Conversion Rate",
    value: "3.2%",
    trend: 0.6,
    color: "bg-emerald-500/10 text-emerald-600",
  },
]

const secondaryKpis = [
  { icon: DollarSign, label: "Revenue Today", value: "UGX 1,230,000", trend: 8.2, color: "bg-[#0B2545]/10 text-[#0B2545]" },
  { icon: TrendingUp, label: "Revenue This Month", value: "UGX 12,450,000", trend: 15.3, color: "bg-[#4A6FA5]/10 text-[#4A6FA5]" },
  { icon: Clock, label: "Pending Orders", value: "23", trend: -8.1, color: "bg-amber-500/10 text-amber-600" },
  { icon: CheckCircle, label: "Successful Payments", value: "1,198", trend: 6.3, color: "bg-emerald-500/10 text-emerald-600" },
  { icon: Package, label: "Products Sold", value: "3,456", trend: 22.4, color: "bg-[#0B2545]/10 text-[#0B2545]" },
  { icon: Star, label: "Active Products", value: "89", trend: 3.1, color: "bg-[#C9A227]/10 text-[#C9A227]" },
  { icon: Download, label: "Total Downloads", value: "8,932", trend: 18.7, color: "bg-[#4A6FA5]/10 text-[#4A6FA5]" },
  { icon: Mail, label: "Newsletter Subscribers", value: "2,341", trend: 9.8, color: "bg-rose-500/10 text-rose-600" },
  { icon: DollarSign, label: "Avg Order Value", value: "UGX 36,500", trend: 4.2, color: "bg-[#0B2545]/10 text-[#0B2545]" },
  { icon: Activity, label: "Store Performance Score", value: "94/100", trend: 2.1, color: "bg-emerald-500/10 text-emerald-600" },
]

const recentOrders = [
  { id: "#ORD-1245", customer: "Sarah Mbabazi", product: "Business Template Pro", total: "UGX 125,000", status: "Completed", date: "2026-07-20" },
  { id: "#ORD-1244", customer: "John Okello", product: "Admin Dashboard Kit", total: "UGX 89,000", status: "Processing", date: "2026-07-20" },
  { id: "#ORD-1243", customer: "Grace Nabatanzi", product: "UI Component Pack", total: "UGX 45,000", status: "Pending", date: "2026-07-19" },
  { id: "#ORD-1242", customer: "David Kato", product: "E-commerce Bundle", total: "UGX 250,000", status: "Completed", date: "2026-07-19" },
  { id: "#ORD-1241", customer: "Alice Muhwezi", product: "Marketing Suite", total: "UGX 67,000", status: "Cancelled", date: "2026-07-18" },
]

const quickActions = [
  { label: "Add Product", icon: ShoppingBag, href: "/admin/products/new", color: "bg-[#0B2545]" },
  { label: "View Orders", icon: ShoppingCart, href: "/admin/orders", color: "bg-[#4A6FA5]" },
  { label: "View Analytics", icon: BarChart3, href: "/admin/analytics", color: "bg-[#C9A227]" },
  { label: "Send Newsletter", icon: Mail, href: "/admin/email", color: "bg-emerald-600" },
  { label: "Download Report", icon: FileDown, href: "/admin/reports", color: "bg-slate-600" },
]

function TrendIndicator({ trend }: { trend: number }) {
  const positive = trend >= 0
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(trend)}%
    </span>
  )
}

function MiniSparkline() {
  return (
    <div className="h-10 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={salesTrendData.slice(-7)}>
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#0B2545"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface PriorityKpiProps {
  icon: React.ElementType
  label: string
  value: string
  trend: number
  color: string
  sparkline?: boolean
}

function PriorityKpiCard({ icon: Icon, label, value, trend, color, sparkline }: PriorityKpiProps) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <TrendIndicator trend={trend} />
        </div>
        <p className="text-sm text-muted-foreground font-body mb-1">{label}</p>
        <div className="flex items-end justify-between gap-4">
          <p className="text-3xl font-bold text-[#0B2545] font-heading">{value}</p>
          {sparkline && <MiniSparkline />}
        </div>
      </CardContent>
    </Card>
  )
}

interface SecondaryKpiProps {
  icon: React.ElementType
  label: string
  value: string
  trend: number
  color: string
}

function SecondaryKpiCard({ icon: Icon, label, value, trend, color }: SecondaryKpiProps) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-full ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <TrendIndicator trend={trend} />
        </div>
        <p className="text-xs text-muted-foreground font-body mb-1">{label}</p>
        <p className="text-lg font-bold text-[#0B2545] font-heading">{value}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    Processing: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    Pending: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    Cancelled: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  }
  return (
    <Badge variant="outline" className={`${styles[status] || ""} font-medium`}>
      {status}
    </Badge>
  )
}

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState("This Month")

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [])

  return (
    <div className="space-y-8">
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545] font-heading">Welcome back, Admin</h1>
          <p className="text-sm text-muted-foreground font-body flex items-center gap-2 mt-1">
            <CalendarDays className="h-4 w-4" />
            {today}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-6 rounded-xl bg-card border border-border px-5 py-3 shadow-soft">
            <div>
              <p className="text-xs text-muted-foreground font-body">Revenue Today</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">UGX 1.23M</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Orders Today</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">42</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground font-body">New Customers</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">18</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Avg. Order</p>
              <p className="text-lg font-bold text-[#0B2545] font-heading">UGX 36.5K</p>
            </div>
          </div>
          <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="This Quarter">This Quarter</SelectItem>
              <SelectItem value="This Year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Priority KPI Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0B2545] font-heading">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {priorityKpis.map((kpi) => (
            <PriorityKpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* Secondary Metrics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0B2545] font-heading">Metric Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {secondaryKpis.map((kpi) => (
            <SecondaryKpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* Charts Section */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-[#0B2545] font-heading">Analytics</h2>

        {/* Row 1: Sales Trends */}
        <Card className="transition-shadow duration-200 hover:shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0B2545]">
              <BarChart3 className="h-5 w-5 text-[#4A6FA5]" />
              Sales Trends
            </CardTitle>
            <CardDescription>Monthly sales performance over the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[300px]">
              <LineChart data={salesTrendData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#0B2545"
                  strokeWidth={3}
                  dot={{ fill: "#0B2545", strokeWidth: 2, r: 4, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#C9A227", stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Row 2: Monthly Revenue + Product Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="transition-shadow duration-200 hover:shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0B2545]">
                <DollarSign className="h-5 w-5 text-[#4A6FA5]" />
                Monthly Revenue
              </CardTitle>
              <CardDescription>Revenue in millions (UGX)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-[300px]">
                <BarChart data={monthlyRevenueData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#0B2545" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-shadow duration-200 hover:shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0B2545]">
                <Package className="h-5 w-5 text-[#4A6FA5]" />
                Product Performance
              </CardTitle>
              <CardDescription>Top products by performance score</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-[300px]">
                <BarChart data={productPerformanceData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#4A6FA5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Downloads + Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="transition-shadow duration-200 hover:shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0B2545]">
                <Download className="h-5 w-5 text-[#4A6FA5]" />
                Downloads by Product
              </CardTitle>
              <CardDescription>Distribution of product downloads</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-[250px]">
                <RePieChart>
                  <Pie
                    data={downloadsData}
                    dataKey="value"
                    nameKey="name"
                    cx="40%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {downloadsData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    content={<ChartLegendContent />}
                  />
                </RePieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-shadow duration-200 hover:shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0B2545]">
                <PieChart className="h-5 w-5 text-[#4A6FA5]" />
                Traffic Sources
              </CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-[250px]">
                <RePieChart>
                  <Pie
                    data={trafficData}
                    dataKey="value"
                    nameKey="name"
                    cx="40%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {trafficData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    content={<ChartLegendContent />}
                  />
                </RePieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Device Analytics + Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="transition-shadow duration-200 hover:shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0B2545]">
                <Monitor className="h-5 w-5 text-[#4A6FA5]" />
                Device Analytics
              </CardTitle>
              <CardDescription>Visitor sessions by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-[250px]">
                <BarChart data={deviceData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {deviceData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-shadow duration-200 hover:shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0B2545]">
                <CreditCard className="h-5 w-5 text-[#4A6FA5]" />
                Payment Methods
              </CardTitle>
              <CardDescription>Transactions by payment channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-[250px]">
                <RePieChart>
                  <Pie
                    data={paymentData}
                    dataKey="value"
                    nameKey="name"
                    cx="40%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {paymentData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    content={<ChartLegendContent />}
                  />
                </RePieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Orders */}
      <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0B2545]">
            <ShoppingCart className="h-5 w-5 text-[#4A6FA5]" />
            Recent Orders
          </CardTitle>
          <CardDescription>Latest customer orders across your store</CardDescription>
          <CardAction>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#4A6FA5] transition-colors hover:bg-muted"
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
                <TableHead className="font-heading text-[#0B2545]">Product</TableHead>
                <TableHead className="text-right font-heading text-[#0B2545]">Total</TableHead>
                <TableHead className="text-center font-heading text-[#0B2545]">Status</TableHead>
                <TableHead className="text-right font-heading text-[#0B2545]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id} className="transition-colors hover:bg-muted/40">
                  <TableCell className="font-medium text-[#0B2545]">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell className="text-right font-medium">{order.total}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{order.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="transition-shadow duration-200 hover:shadow-card">
        <CardHeader>
          <CardTitle className="text-[#0B2545]">Quick Actions</CardTitle>
          <CardDescription>Frequently used admin tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium shadow-soft transition-all hover:bg-muted hover:border-[#4A6FA5]/30 hover:shadow-card"
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
