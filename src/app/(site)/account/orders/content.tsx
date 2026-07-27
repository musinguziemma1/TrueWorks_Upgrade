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
import { ShoppingBag } from "lucide-react";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-UG", {
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

  return (
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
                  {o.items.length}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {fmtMoney(o.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
