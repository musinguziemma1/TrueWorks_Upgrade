"use client"

import { useState } from "react"
import {
  Calendar, BarChart3, DollarSign, Package,
  Users, Download as DownloadIcon, Percent, ShoppingCart, Mail,
  FileSpreadsheet, FileType, FileText,
} from "lucide-react"
import { AdminPageHeader } from "@/components/layout/admin-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReportCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  lightColor: string
  textColor: string
}

const reports: ReportCard[] = [
  { id: "sales", title: "Sales Report", description: "Daily, weekly, and monthly sales data with trends", icon: <BarChart3 className="h-6 w-6" />, color: "bg-blue-500", lightColor: "bg-blue-50", textColor: "text-blue-600" },
  { id: "revenue", title: "Revenue Report", description: "Revenue breakdown by product, category, and period", icon: <DollarSign className="h-6 w-6" />, color: "bg-green-500", lightColor: "bg-green-50", textColor: "text-green-600" },
  { id: "products", title: "Products Report", description: "Best-selling products, inventory levels, and performance", icon: <Package className="h-6 w-6" />, color: "bg-purple-500", lightColor: "bg-purple-50", textColor: "text-purple-600" },
  { id: "customers", title: "Customers Report", description: "Customer acquisition, retention, and lifetime value", icon: <Users className="h-6 w-6" />, color: "bg-amber-500", lightColor: "bg-amber-50", textColor: "text-amber-600" },
  { id: "downloads", title: "Downloads Report", description: "Download counts, popular files, and usage metrics", icon: <DownloadIcon className="h-6 w-6" />, color: "bg-cyan-500", lightColor: "bg-cyan-50", textColor: "text-cyan-600" },
  { id: "tax", title: "Tax Report", description: "Tax collected, VAT summaries, and compliance data", icon: <Percent className="h-6 w-6" />, color: "bg-rose-500", lightColor: "bg-rose-50", textColor: "text-rose-600" },
  { id: "coupons", title: "Coupons Report", description: "Coupon usage, discounts applied, and campaign ROI", icon: <ShoppingCart className="h-6 w-6" />, color: "bg-orange-500", lightColor: "bg-orange-50", textColor: "text-orange-600" },
  { id: "marketing", title: "Marketing Report", description: "Email campaigns, traffic sources, and conversion data", icon: <Mail className="h-6 w-6" />, color: "bg-indigo-500", lightColor: "bg-indigo-50", textColor: "text-indigo-600" },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("This Month")

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports"
        description="Generate and download business reports"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Reports" }]}
        action={
          <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
            <SelectTrigger className="w-[150px]"><Calendar className="h-4 w-4 mr-1" /> <SelectValue /></SelectTrigger>
            <SelectContent>
              {["Today", "This Week", "This Month", "This Quarter", "This Year", "Custom Range"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-card transition-shadow overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5">
                <div className={`w-12 h-12 rounded-xl ${report.lightColor} ${report.textColor} flex items-center justify-center mb-4`}>
                  {report.icon}
                </div>
                <h3 className="font-semibold text-primary mb-1">{report.title}</h3>
                <p className="text-xs text-muted-foreground mb-4">{report.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800">
                    <FileType className="h-3.5 w-3.5" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              </div>
              <div className={`h-1 w-full ${report.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
