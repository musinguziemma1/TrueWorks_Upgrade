"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RotateCcw, Mail, CheckCircle2, XCircle } from "lucide-react";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function refundTotal(ret: { items: { price: number; quantity: number }[] }): number {
  return ret.items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
}

function ReturnTimeline({ status }: { status: string }) {
  const steps = [
    { id: "pending", label: "Request received" },
    { id: "approved", label: "Approved by our team" },
    { id: "completed", label: "Money returned" },
  ];
  const currentIndex = steps.findIndex((s) => s.id === status);
  const rejected = status === "rejected";

  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => {
        const reached = rejected ? false : currentIndex >= i;
        const isLast = i === steps.length - 1;
        return (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  rejected
                    ? "bg-red-50 text-red-500"
                    : reached
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {rejected && isLast ? (
                  <XCircle className="h-3 w-3" />
                ) : reached ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            <p
              className={`text-sm ${
                rejected ? (isLast ? "text-destructive" : "text-muted-foreground line-through") : reached ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_HINT: Record<string, string> = {
  pending: "Our team is reviewing your request. We typically respond within 1-2 business days.",
  approved: "Your refund has been approved. The money will be returned to your original payment method shortly.",
  completed: "Your refund has been processed and returned to your original payment method.",
  rejected: "Your request was not approved. Contact support if you believe this is an error.",
};

export default function ReturnsContent() {
  const returns = useQuery(api.returns.listMine);

  if (returns === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (returns.length === 0) {
    return (
      <EmptyState
        icon={<RotateCcw className="h-12 w-12" />}
        title="No return requests"
        description="If you need to return a product, you can request a refund from the order detail page."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {returns.length} return {returns.length === 1 ? "request" : "requests"}.
      </p>
      <div className="space-y-4">
        {returns.map((ret) => (
          <Card key={ret._id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    Return for Order {ret.orderNumber}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {fmtDate(ret.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={ret.status} />
                  <p className="text-sm font-semibold text-primary">
                    {fmtMoney(refundTotal(ret))}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ret.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between border-b border-border pb-2 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} &middot; {fmtMoney(item.price)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reason: {item.reason}
                    </p>
                  </div>
                </div>
              ))}
              {(ret.notes || ret.adminNotes) && (
                <div className="rounded-lg border border-border/70 bg-surface p-3 space-y-1.5">
                  {ret.notes && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Your note:</span> {ret.notes}
                    </p>
                  )}
                  {ret.adminNotes && (
                    <p className="text-xs text-primary">
                      <span className="font-medium">Admin response:</span>{" "}
                      {ret.adminNotes}
                    </p>
                  )}
                </div>
              )}

              <ReturnTimeline status={ret.status} />

              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {STATUS_HINT[ret.status] ?? "We'll email you with any updates."}
              </p>

              <Link
                href={`/account/orders/${ret.orderId}`}
                className="inline-block text-sm text-primary hover:underline"
              >
                View original order →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}