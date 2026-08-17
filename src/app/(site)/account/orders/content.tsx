"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingBag, CreditCard, CheckCircle2, RotateCcw } from "lucide-react";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersContent() {
  const orders = useQuery(api.orders.listMine);

  if (orders === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-12 w-12" />}
        title="No orders yet"
        description="When you purchase a product, it will appear here."
      />
    );
  }

  const completed = orders.filter((o) => o.paymentStatus === "completed").length;
  const refunded = orders.filter((o) => o.paymentStatus === "refunded").length;
  const totalSpent = orders
    .filter((o) => o.paymentStatus === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-[#0B2545]" },
          { label: "Total Spent", value: fmtMoney(totalSpent), icon: CreditCard, color: "text-[#3E6990]" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Refunded", value: refunded, icon: RotateCcw, color: "text-orange-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="font-medium">
                    <Link href={`/account/orders/${o._id}`} className="text-primary hover:underline">
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fmtDate(o._creationTime)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.orderStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.items.length} item{o.items.length === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {fmtMoney(o.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5" />
                      {o.paymentMethod}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}