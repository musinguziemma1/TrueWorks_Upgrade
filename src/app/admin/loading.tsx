export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-white" />
    </div>
  );
}
