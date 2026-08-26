import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  icon,
  label,
  value,
  sub,
  delta,
  spark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  spark?: number[];
}) {
  const deltaColor = delta === undefined ? "" : delta >= 0 ? "text-emerald-600" : "text-red-600";
  const deltaArrow = delta === undefined ? "" : delta >= 0 ? "\u25B2" : "\u25BC";
  const max = spark && spark.length ? Math.max(...spark, 1) : 0;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-[#0B2545]/10 text-[#0B2545]">{icon}</div>
          {delta !== undefined && (
            <span className={`text-[11px] font-semibold ${deltaColor}`}>
              {deltaArrow} {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xl font-bold text-[#0B2545]">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
      {spark && spark.length > 1 && (
        <div className="flex h-8 items-end gap-[2px] px-4 pb-2">
          {spark.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-[#0B2545]/[0.18]"
              style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
              title={String(v)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
