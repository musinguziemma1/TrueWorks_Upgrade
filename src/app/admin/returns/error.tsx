"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReturnsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin returns page failed to load", error);
  }, [error]);

  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-600" />
        <h1 className="text-xl font-semibold">Refund requests are unavailable</h1>
        <p className="mt-2 text-sm text-muted">
          The refund data could not be loaded. Check your connection and try again.
        </p>
        <Button onClick={reset} className="mt-6 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
