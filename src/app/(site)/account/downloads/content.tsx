"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DownloadsContent() {
  const downloads = useQuery(api.downloads.listMine);
  const recordDownload = useMutation(api.downloads.recordDownload);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const handleDownload = async (downloadId: string) => {
    setDownloadingId(downloadId);
    try {
      // recordDownload validates ownership/limits server-side and returns a
      // freshly-minted signed URL — never the stored permanent URL.
      const signedUrl = await recordDownload({
        id: downloadId as never,
        browser: navigator.userAgent,
      });
      if (!signedUrl) {
        toast.error("Download unavailable");
        return;
      }
      window.open(signedUrl, "_blank");
      toast.success("Download started");
    } catch (err: any) {
      toast.error(err.message ?? "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {downloads.map((d) => {
        const canDownload = d.status === "active" && d.remainingDownloads > 0 && d.expiresAt > Date.now();
        return (
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
              <div className="pt-2">
                {canDownload ? (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleDownload(d._id)}
                    disabled={downloadingId === d._id}
                  >
                    {downloadingId === d._id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download File
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    {d.status === "expired" ? "Expired" : d.remainingDownloads <= 0 ? "No downloads left" : "Unavailable"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
