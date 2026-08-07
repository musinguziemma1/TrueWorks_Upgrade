"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Download, KeyRound, Copy, Check, Loader2 } from "lucide-react";
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
  const licenses = useQuery(api.licenses.listMine);
  const recordDownload = useMutation(api.downloads.recordDownload);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  if (downloads === undefined || licenses === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (downloads.length === 0 && licenses.length === 0) {
    return (
      <EmptyState
        icon={<Download className="h-12 w-12" />}
        title="No downloads"
        description="Purchased downloads and license keys will appear here."
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {licenses.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            License Keys
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {licenses.map((l) => (
              <Card key={l._id}>
                <CardHeader>
                  <CardTitle className="text-base">{l.productName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2">
                    <code className="font-mono text-xs text-foreground">{l.key}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyKey(l.key)}
                      aria-label="Copy license key"
                    >
                      {copiedKey === l.key ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Activations</span>
                    <span>{l.activations} / {l.maxActivations}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {downloads.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Download className="h-4 w-4 text-primary" />
            Downloads
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {downloads.map((d) => {
              const canDownload = d.status === "active" && d.remainingDownloads > 0 && d.expiresAt > now;
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
        </section>
      )}
    </div>
  );
}
