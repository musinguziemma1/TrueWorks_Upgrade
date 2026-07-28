"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RotateCcw } from "lucide-react";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    Return for Order {ret.orderNumber}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {fmtDate(ret.createdAt)}
                  </p>
                </div>
                <StatusBadge status={ret.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
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
              {ret.notes && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Your note:</span> {ret.notes}
                </p>
              )}
              {ret.adminNotes && (
                <p className="text-xs text-primary">
                  <span className="font-medium">Admin response:</span>{" "}
                  {ret.adminNotes}
                </p>
              )}
              <Link
                href={`/account/orders/${ret.orderId}`}
                className="inline-block text-sm text-accent hover:underline"
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
