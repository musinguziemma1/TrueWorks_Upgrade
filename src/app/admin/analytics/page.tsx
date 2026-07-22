"use client"

import { useState } from "react"
import { BarChart3, Download, Globe, Users, ShoppingCart, Clock, PieChart, Smartphone, Monitor, CreditCard, ArrowUpRight, DollarSign, Package } from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from "recharts"

const salesData = [
  { month: "Jan", value: 28 }, { month: "Feb", value: 35 }, { month: "Mar", value: 42 },
  { month: "Apr", value: 38 }, { month: "May", value: 52 }, { month: "Jun", value: 48 },
  { month: "Jul", value: 58 }, { month: "Aug", value: 55 }, { month: "Sep", value: 62 },
  { month: "Oct", value: 70 }, { month: "Nov", value: 65 }, { month: "Dec", value: 78 },
]

const revData = [
  { month: "Jan", value: 4.2 }, { month: "Feb", value: 3.8 }, { month: "Mar", value: 5.1 },
  { month: "Apr", value: 4.5 }, { month: "May", value: 6.2 }, { month: "Jun", value: 5.8 },
  { month: "Jul", value: 7.1 }, { month: "Aug", value: 6.5 }, { month: "Sep", value: 5.9 },
  { month: "Oct", value: 8.2 }, { month: "Nov", value: 7.4 }, { month: "Dec", value: 9.0 },
]

const productPerf = [
  { name: "Business Template Pro", value: 95, sales: "UGX 11.9M" },
  { name: "Admin Dashboard Kit", value: 82, sales: "UGX 7.3M" },
  { name: "E-commerce Bundle", value: 74, sales: "UGX 18.5M" },
  { name: "UI Component Pack", value: 65, sales: "UGX 3.8M" },
  { name: "Portfolio Template", value: 58, sales: "UGX 2.5M" },
  { name: "Marketing Suite", value: 52, sales: "UGX 3.5M" },
  { name: "Invoice Generator", value: 48, sales: "UGX 2.1M" },
  { name: "SaaS Landing Page", value: 42, sales: "UGX 2.8M" },
  { name: "Analytics Dashboard", value: 38, sales: "UGX 1.9M" },
  { name: "CRM Software Kit", value: 35, sales: "UGX 1.7M" },
]

const downloadsSeg = [
  { name: "Business Template Pro", value: 35, color: "#0B2545" },
  { name: "Admin Dashboard Kit", value: 22, color: "#4A6FA5" },
  { name: "E-commerce Bundle", value: 18, color: "#C9A227" },
  { name: "UI Component Pack", value: 12, color: "#60A5FA" },
  { name: "Portfolio Template", value: 8, color: "#34D399" },
  { name: "Others", value: 5, color: "#94A3B8" },
]

const trafficSeg = [
  { name: "Direct", value: 45, color: "#0B2545" },
  { name: "Search", value: 30, color: "#4A6FA5" },
  { name: "Social", value: 15, color: "#C9A227" },
  { name: "Email", value: 10, color: "#60A5FA" },
]

const deviceSeg = [
  { name: "Desktop", value: 55 },
  { name: "Mobile", value: 35 },
  { name: "Tablet", value: 10 },
]

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

const ltvSegments = [
  { range: "0 - UGX 50,000", count: 320, pct: 36 },
  { range: "UGX 50,000 - UGX 200,000", count: 280, pct: 31 },
  { range: "UGX 200,000 - UGX 500,000", count: 160, pct: 18 },
  { range: "UGX 500,000 - UGX 1M", count: 80, pct: 9 },
  { range: "UGX 1M+", count: 52, pct: 6 },
]

const chartConfig = { value: { label: "Value", color: "#0B2545" } }
const COLORS = ["#0B2545", "#4A6FA5", "#C9A227", "#60A5FA", "#34D399", "#94A3B8"]

function MetricCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xl font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("This Year")

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        description="Deep dive into your store performance, traffic, and customer behavior."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Analytics" }]}
        action={
          <>
            <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Today", "This Week", "This Month", "This Quarter", "This Year"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline"><Download className="h-4 w-4" /> Download Report</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<BarChart3 className="h-5 w-5" />} label="Total Revenue" value="UGX 45,230,000" trend={12.5} />
        <MetricCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Orders" value="1,247" trend={8.3} />
        <MetricCard icon={<Users className="h-5 w-5" />} label="Active Customers" value="892" trend={11.2} />
        <MetricCard icon={<Clock className="h-5 w-5" />} label="Abandoned Carts" value="143" trend={-5.8} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><BarChart3 className="h-5 w-5" /> Sales Trends</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[220px]">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="value" stroke="#0B2545" strokeWidth={2} dot={{ fill: "#0B2545" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><DollarSign className="h-5 w-5" /> Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[220px]">
              <BarChart data={revData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#0B2545" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Package className="h-5 w-5" /> Product Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2.5 pt-2">
              {productPerf.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{item.name}</span>
                    <span className="text-muted-foreground text-xs">{item.sales}</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Download className="h-5 w-5" /> Downloads by Product</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[280px]">
              <RePieChart>
                <Pie data={downloadsSeg} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {downloadsSeg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Smartphone className="h-5 w-5" /> Device Analytics</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-5 pt-2">
              {[
                { label: "Desktop", value: 55, icon: Monitor },
                { label: "Mobile", value: 35, icon: Smartphone },
                { label: "Tablet", value: 10, icon: CreditCard },
              ].map((device) => (
                <div key={device.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <device.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{device.label}</span>
                    </div>
                    <span className="text-muted-foreground">{device.value}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${device.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
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
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Users className="h-5 w-5" /> Customer Lifetime Value</CardTitle></CardHeader>
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
