import type { Metadata } from "next";
import { Suspense } from "react";
import StoreContent from "./content";

export const metadata: Metadata = {
  title: "Store - Premium Templates & Business Systems",
  description:
    "Browse professional-grade Excel templates, financial models and dashboards for healthcare, NGOs, schools, churches and growing businesses. Instant download after purchase.",
};

function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
          <div className="h-3 w-20 animate-pulse rounded bg-surface" />
          <div className="mt-4 h-9 w-2/3 max-w-lg animate-pulse rounded-lg bg-surface" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="h-32 animate-pulse rounded-xl border border-border bg-white" />
        <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-xl border border-border bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  return (
    <Suspense fallback={<StoreSkeleton />}>
      <StoreContent />
    </Suspense>
  );
}
