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
  Eye,
  X,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { downloadCsv, toCsv } from "@/lib/csv";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function rangeStart(range: string): number {
  const now = new Date();
  const at = (y: number, m: number, d = 1) => new Date(y, m, d).getTime();
  switch (range) {
    case "Today":
      return at(now.getFullYear(), now.getMonth(), now.getDate());
    case "This Week": {
      const day = now.getDay(); // 0 = Sunday
      return at(now.getFullYear(), now.getMonth(), now.getDate() - day);
    }
    case "This Month":
      return at(now.getFullYear(), now.getMonth());
    case "This Quarter": {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      return at(now.getFullYear(), qStart);
    }
    case "This Year":
      return at(now.getFullYear(), 0);
    default:
      return 0;
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

function rowCountFor(
  id: ReportId,
  sources: {
    orders: unknown[];
    products?: { length: number } | null;
    customers?: { length: number } | null;
    downloads?: { length: number } | null;
    coupons?: { length: number } | null;
    subscribers?: { length: number } | null;
  }
): number {
  switch (id) {
    case "sales":
    case "revenue":
      return sources.orders.length;
    case "products":
      return sources.products?.length ?? 0;
    case "customers":
      return sources.customers?.length ?? 0;
    case "downloads":
      return sources.downloads?.length ?? 0;
    case "coupons":
      return sources.coupons?.length ?? 0;
    case "marketing":
      return sources.subscribers?.length ?? 0;
  }
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("This Month");
  const [preview, setPreview] = useState<ReportId | null>(null);

  // Bound the orders read to the selected range so the scan stays small; the
  // client-side `since` filter below remains as a safety net.
  const since = rangeStart(dateRange);
  const products = useQuery(api.products.list, { status: "published" });
  const orders = useQuery(api.orders.list, { startDate: since });
  const customers = useQuery(api.customers.list, {});
  const downloads = useQuery(api.downloads.listAll, {});
  const coupons = useQuery(api.coupons.list, {});
  const subscribers = useQuery(api.subscribers.list, {});

  // Filter orders by date range
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
      avgOrderValue: completed.length > 0 ? revenue / completed.length : 0,
      refunded: filteredOrders.filter((o) => o.paymentStatus === "refunded").length,
    };
  }, [filteredOrders]);

  const exportReport = (reportId: ReportId) => {
    const stamp = new Date().toISOString().slice(0, 10);
    let csv = "";
    const filename = `${reportId}-report-${stamp}`;

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
            <SelectTrigger className="w-[150px]" aria-label="Date range for reports">
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
            <SummaryCard label="Revenue (USD)" value={fmtMoney(stats.revenue)} icon={DollarSign} />
            <SummaryCard label="Avg Order (USD)" value={fmtMoney(stats.avgOrderValue)} icon={BarChart3} />
            <SummaryCard label="Refunded" value={String(stats.refunded)} icon={Percent} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {REPORTS.map((report) => {
              const rowCount = rowCountFor(report.id, {
                orders: filteredOrders,
                products,
                customers,
                downloads,
                coupons,
                subscribers,
              })
              return (
                <Card key={report.id} className="hover:shadow-card transition-shadow overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className={`w-12 h-12 rounded-xl ${report.lightColor} ${report.textColor} flex items-center justify-center mb-4`}>
                        <report.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-primary mb-1">{report.title}</h3>
                      <p className="text-xs text-muted-foreground mb-4">{report.description}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={rowCount === 0}
                        className="flex-1 gap-2 border-[#0B2545]/30 text-[#0B2545] hover:bg-[#0B2545]/5 disabled:opacity-50 disabled:pointer-events-none"
                        onClick={() => setPreview(report.id)}
                        aria-label={`Preview ${report.title}`}
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={rowCount === 0}
                        className="flex-1 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 disabled:pointer-events-none"
                        onClick={() => exportReport(report.id)}
                        aria-label={`Download ${report.title} as CSV`}
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                      </Button>
                    </div>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      {rowCount > 0 ? `${rowCount.toLocaleString()} rows` : "No data in range"}
                    </p>
                    </div>
                    <div className={`h-1 w-full ${report.color}`} />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {preview && (
            <ReportPreview
              reportId={preview}
              onClose={() => setPreview(null)}
              sources={{
                orders: filteredOrders,
                products,
                customers,
                downloads,
                coupons,
                subscribers,
              }}
            />
          )}
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

interface ReportSources {
  orders: unknown[];
  products?: unknown[] | null;
  customers?: unknown[] | null;
  downloads?: unknown[] | null;
  coupons?: unknown[] | null;
  subscribers?: unknown[] | null;
}

function ReportPreview({ reportId, onClose, sources }: {
  reportId: ReportId;
  onClose: () => void;
  sources: ReportSources;
}) {
  const title = REPORTS.find((r) => r.id === reportId)?.title ?? "Report";

  const previewRows = (() => {
    switch (reportId) {
      case "sales":
      case "revenue": {
        const rows = (sources.orders as { orderNumber: string; _creationTime: number; customerName: string; customerEmail: string; paymentStatus: string; total: number; subtotal: number }[]).slice(0, 8);
        return {
          headers: ["Order", "Date", "Customer", "Status", "Total"],
          cells: rows.map((o) => [o.orderNumber, fmtDate(o._creationTime), o.customerEmail, o.paymentStatus, fmtMoney(o.total)]),
        };
      }
      case "products": {
        const rows = (sources.products as { name: string; sku: string; category: string; price: number; totalSales: number }[]).slice(0, 8);
        return {
          headers: ["Name", "SKU", "Category", "Price", "Sales"],
          cells: rows.map((p) => [p.name, p.sku, p.category, fmtMoney(p.price), String(p.totalSales)]),
        };
      }
      case "customers": {
        const rows = (sources.customers as { name: string; email: string; totalOrders: number; lifetimeValue: number }[]).slice(0, 8);
        return {
          headers: ["Name", "Email", "Orders", "LTV"],
          cells: rows.map((c) => [c.name, c.email, String(c.totalOrders), fmtMoney(c.lifetimeValue)]),
        };
      }
      case "downloads": {
        const rows = (sources.downloads as { productName: string; email: string; status: string; downloadCount: number }[]).slice(0, 8);
        return {
          headers: ["Product", "Email", "Status", "Count"],
          cells: rows.map((d) => [d.productName, d.email, d.status, String(d.downloadCount)]),
        };
      }
      case "coupons": {
        const rows = (sources.coupons as { code: string; type: string; value: number; usageCount: number; usageLimit?: number | null }[]).slice(0, 8);
        return {
          headers: ["Code", "Type", "Value", "Used", "Limit"],
          cells: rows.map((c) => [c.code, c.type, String(c.value), String(c.usageCount), c.usageLimit ? String(c.usageLimit) : "∞"]),
        };
      }
      case "marketing": {
        const rows = (sources.subscribers as { email: string; name?: string | null; source?: string | null; active: boolean }[]).slice(0, 8);
        return {
          headers: ["Email", "Name", "Source", "Active"],
          cells: rows.map((s) => [s.email, s.name ?? "", s.source ?? "", s.active ? "yes" : "no"]),
        };
      }
    }
  })();

  if (!previewRows || previewRows.cells.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">{title} — Preview</h3>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close report preview"><X className="h-4 w-4" /></Button>
          </div>
          <p className="text-sm text-muted-foreground">No rows to preview in the selected range.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary">{title} &mdash; Preview (first {previewRows.cells.length})</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close report preview"><X className="h-4 w-4" /></Button>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {previewRows.headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.cells.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
