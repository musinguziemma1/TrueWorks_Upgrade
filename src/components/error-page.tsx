"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

export function ErrorPage({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error occurred. Our team has been notified. You can try again or head back home.",
}: ErrorPageProps) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </span>
      <h1 className="mt-6 font-heading text-2xl font-semibold text-primary sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        {description}
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted/60">Error ID: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button
          onClick={reset}
          size="lg"
          className="gradient-gold px-6 font-semibold text-primary-dark hover:brightness-105"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" size="lg" className="border-primary/20 px-6 font-semibold text-primary">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
