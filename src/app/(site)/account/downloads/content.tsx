"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Download } from "lucide-react";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DownloadsContent() {
  const downloads = useQuery(api.downloads.listMine);

  if (downloads === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (downloads.length === 0) {
    return (
      <EmptyState
        icon={<Download className="h-12 w-12" />}
        title="No downloads"
        description="Purchased downloads will appear here."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {downloads.map((d) => (
        <Card key={d._id}>
          <CardHeader>
            <CardTitle className="text-base">{d.productName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={d.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Downloads</span>
              <span>{d.remainingDownloads} left</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expires</span>
              <span>{fmtDate(d.expiresAt)}</span>
            </div>
            {d.productSlug && (
              <Link
                href={`/store/${d.productSlug}`}
                className="inline-block text-sm text-accent hover:underline"
              >
                View product →
              </Link>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
