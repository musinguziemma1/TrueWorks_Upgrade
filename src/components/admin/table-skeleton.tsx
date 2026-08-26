import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/** Shimmering placeholder rows for admin tables while data loads. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, row) => (
            <div key={row} className="flex items-center gap-4 px-4 py-3">
              {Array.from({ length: cols }).map((_, col) => (
                <Skeleton
                  key={col}
                  className="h-4"
                  style={{ width: col === 0 ? "18%" : `${Math.max(10, 70 / Math.max(1, cols - 1))}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Placeholder for a KPI stat card. */
export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-7 w-16" />
      </CardContent>
    </Card>
  );
}
