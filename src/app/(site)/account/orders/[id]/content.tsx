"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  CreditCard,
  Truck,
  Mail,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STEPS = [
  { id: "pending", label: "Order placed", icon: Clock },
  { id: "processing", label: "Processing", icon: Package },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

function Timeline({ orderStatus, paymentStatus }: { orderStatus: string; paymentStatus: string }) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.id === orderStatus);
  return (
    <ol className="space-y-4">
      {STATUS_STEPS.map((step, i) => {
        const reached = currentIndex >= i;
        const Icon = step.icon;
        return (
          <li key={step.id} className="flex gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                reached ? "bg-primary text-white" : "bg-surface text-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex flex-1 items-center justify-between pt-1.5">
              <span className={`text-sm font-medium ${reached ? "text-foreground" : "text-muted"}`}>
                {step.label}
              </span>
              {orderStatus === "cancelled" && step.id !== "pending" && (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </li>
        );
      })}
      <li className="mt-6 rounded-lg border border-border/70 bg-surface p-3 text-sm">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="font-medium">Payment:</span>
          <StatusBadge status={paymentStatus} />
        </div>
      </li>
    </ol>
  );
}

export default function OrderDetailLoader() {
  const { id } = useParams<{ id: string }>();
  const order = useQuery(api.orders.getById, id ? { id: id as any } : "skip");

  if (order === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-heading text-2xl font-semibold text-primary">Order not found</h1>
        <p className="mt-2 text-sm text-muted">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link
          href="/account/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed on {fmtDate(order._creationTime)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.orderStatus} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {fmtMoney(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium">{fmtMoney(item.price * item.quantity)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline orderStatus={order.orderStatus} paymentStatus={order.paymentStatus} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{fmtMoney(order.subtotal)}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="flex justify-between text-success">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <span>-{fmtMoney(order.discountAmount)}</span>
                </div>
              ) : null}
              {order.tax > 0 ? (
                <div className="flex justify-between text-muted">
                  <span>Tax</span>
                  <span>{fmtMoney(order.tax)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-3 font-heading text-base font-semibold text-primary">
                <span>Total</span>
                <span>{fmtMoney(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.customerName}</p>
              <p className="flex items-center gap-2 text-muted">
                <Mail className="h-3.5 w-3.5" />
                {order.customerEmail}
              </p>
              <p className="flex items-center gap-2 text-muted">
                <Truck className="h-3.5 w-3.5" />
                {order.paymentMethod}
              </p>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {order.orderStatus === "completed" && order.downloadLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Downloads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.downloadLinks.map((dl, i) => (
                  <a
                    key={i}
                    href={dl.url}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    <Package className="h-4 w-4" />
                    Download {i + 1}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
