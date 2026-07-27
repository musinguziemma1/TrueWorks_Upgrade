"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  BarChart3,
  DollarSign,
  Package,
  Users,
  Download as DownloadIcon,
  Percent,
  ShoppingCart,
  Mail,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCsv, toCsv } from "@/lib/csv";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function rangeStart(range: string): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
    case "Today": return now - day;
    case "This Week": return now - 7 * day;
    case "This Month": return now - 30 * day;
    case "This Quarter": return now - 90 * day;
    case "This Year": return now - 365 * day;
    default: return 0;
  }
}

const REPORTS = [
  { id: "sales", title: "Sales Report", description: "Daily, weekly, and monthly sales data with trends", icon: BarChart3, color: "bg-blue-500", lightColor: "bg-blue-50", textColor: "text-blue-600" },
  { id: "revenue", title: "Revenue Report", description: "Revenue breakdown by order", icon: DollarSign, color: "bg-green-500", lightColor: "bg-green-50", textColor: "text-green-600" },
  { id: "products", title: "Products Report", description: "Catalog performance and sales counts", icon: Package, color: "bg-purple-500", lightColor: "bg-purple-50", textColor: "text-purple-600" },
  { id: "customers", title: "Customers Report", description: "Customer records and lifetime value", icon: Users, color: "bg-amber-500", lightColor: "bg-amber-50", textColor: "text-amber-600" },
  { id: "downloads", title: "Downloads Report", description: "Download counts and statuses", icon: DownloadIcon, color: "bg-cyan-500", lightColor: "bg-cyan-50", textColor: "text-cyan-600" },
  { id: "coupons", title: "Coupons Report", description: "Coupon usage and remaining limits", icon: ShoppingCart, color: "bg-orange-500", lightColor: "bg-orange-50", textColor: "text-orange-600" },
  { id: "marketing", title: "Marketing Report", description: "Newsletter subscribers and engagement", icon: Mail, color: "bg-indigo-500", lightColor: "bg-indigo-50", textColor: "text-indigo-600" },
] as const;

type ReportId = (typeof REPORTS)[number]["id"];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("This Month");

  const products = useQuery(api.products.list, { status: "published" });
  const orders = useQuery(api.orders.list, {});
  const customers = useQuery(api.customers.list, {});
  const downloads = useQuery(api.downloads.listAll, {});
  const coupons = useQuery(api.coupons.list, {});
  const subscribers = useQuery(api.subscribers.list, {});

  // Filter orders by date range
  const since = rangeStart(dateRange);
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => o._creationTime >= since);
  }, [orders, since]);

  const stats = useMemo(() => {
    const completed = filteredOrders.filter((o) => o.paymentStatus === "completed");
    const revenue = completed.reduce((sum, o) => sum + o.total, 0);
    return {
      orders: filteredOrders.length,
      revenue,
      avgOrderValue: completed.length > 0 ? Math.round(revenue / completed.length) : 0,
      refunded: filteredOrders.filter((o) => o.paymentStatus === "refunded").length,
    };
  }, [filteredOrders]);

  const exportReport = (reportId: ReportId) => {
    const stamp = new Date().toISOString().slice(0, 10);
    let csv = "";
    let filename = `${reportId}-report-${stamp}`;

    switch (reportId) {
      case "sales":
        csv = toCsv(
          filteredOrders.map((o) => ({
            orderNumber: o.orderNumber,
            date: fmtDate(o._creationTime),
            customer: o.customerName,
            email: o.customerEmail,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            orderStatus: o.orderStatus,
            subtotal: o.subtotal,
            discount: o.discountAmount ?? 0,
            tax: o.tax,
            total: o.total,
            coupon: o.couponCode ?? "",
          }))
        );
        break;
      case "revenue":
        csv = toCsv(
          filteredOrders
            .filter((o) => o.paymentStatus === "completed")
            .map((o) => ({
              orderNumber: o.orderNumber,
              date: fmtDate(o._creationTime),
              subtotal: o.subtotal,
              discount: o.discountAmount ?? 0,
              tax: o.tax,
              total: o.total,
            }))
        );
        break;
      case "products":
        csv = toCsv(
          (products ?? []).map((p) => ({
            name: p.name,
            sku: p.sku,
            category: p.category,
            price: p.price,
            salePrice: p.salePrice ?? "",
            rating: p.rating,
            reviewCount: p.reviewCount,
            totalSales: p.totalSales,
          }))
        );
        break;
      case "customers":
        csv = toCsv(
          (customers ?? []).map((c) => ({
            name: c.name,
            email: c.email,
            phone: c.phone ?? "",
            totalOrders: c.totalOrders,
            lifetimeValue: c.lifetimeValue,
            newsletter: c.newsletterSubscribed ? "yes" : "no",
            joined: fmtDate(c._creationTime),
          }))
        );
        break;
      case "downloads":
        csv = toCsv(
          (downloads ?? []).map((d) => ({
            product: d.productName,
            email: d.email,
            status: d.status,
            downloadCount: d.downloadCount,
            remainingDownloads: d.remainingDownloads,
            createdAt: fmtDate(d.createdAt),
          }))
        );
        break;
      case "coupons":
        csv = toCsv(
          (coupons ?? []).map((c) => ({
            code: c.code,
            type: c.type,
            value: c.value,
            usageCount: c.usageCount,
            usageLimit: c.usageLimit ?? "",
            isActive: c.isActive ? "yes" : "no",
          }))
        );
        break;
      case "marketing":
        csv = toCsv(
          (subscribers ?? []).map((s) => ({
            email: s.email,
            name: s.name ?? "",
            source: s.source ?? "",
            active: s.active ? "yes" : "no",
            joined: fmtDate(s._creationTime),
          }))
        );
        break;
    }

    if (csv) downloadCsv(filename, csv);
  };

  const loading =
    products === undefined ||
    orders === undefined ||
    customers === undefined ||
    downloads === undefined ||
    coupons === undefined ||
    subscribers === undefined;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports"
        description="Generate and download business reports"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Reports" }]}
        action={
          <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Today", "This Week", "This Month", "This Quarter", "This Year", "All Time"].map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Orders (period)" value={String(stats.orders)} icon={ShoppingCart} />
            <SummaryCard label="Revenue (UGX)" value={stats.revenue.toLocaleString()} icon={DollarSign} />
            <SummaryCard label="Avg Order (UGX)" value={stats.avgOrderValue.toLocaleString()} icon={BarChart3} />
            <SummaryCard label="Refunded" value={String(stats.refunded)} icon={Percent} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {REPORTS.map((report) => (
              <Card key={report.id} className="hover:shadow-card transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className={`w-12 h-12 rounded-xl ${report.lightColor} ${report.textColor} flex items-center justify-center mb-4`}>
                      <report.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-primary mb-1">{report.title}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{report.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      onClick={() => exportReport(report.id)}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" /> Download CSV
                    </Button>
                  </div>
                  <div className={`h-1 w-full ${report.color}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.06] text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
          <p className="font-heading text-xl font-bold text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
