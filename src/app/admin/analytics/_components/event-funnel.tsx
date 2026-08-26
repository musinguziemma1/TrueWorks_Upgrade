const STEP_LABELS: Record<string, string> = {
  view_product: "Viewed Product",
  add_to_cart: "Added to Cart",
  reach_checkout: "Reached Checkout",
  payment_start: "Started Payment",
  purchase: "Purchased",
};

export function EventFunnel({
  funnel,
}: {
  funnel: { name: string; count: number }[];
  rates?: { from: string; to: string; rate: number }[];
}) {
  const max = Math.max(1, ...funnel.map((s) => s.count));
  if (funnel.every((s) => s.count === 0)) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No funnel events yet. Events are recorded as customers browse, add to cart,
        and check out.
      </p>
    );
  }
  return (
    <div className="space-y-3 pt-2">
      {funnel.map((step, i) => (
        <div key={step.name}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="capitalize">{STEP_LABELS[step.name] ?? step.name.replace(/_/g, " ")}</span>
            <div className="flex items-center gap-2">
              {i > 0 && funnel[i - 1].count > 0 && step.count > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {Math.round((step.count / funnel[i - 1].count) * 100)}% step
                </span>
              )}
              <span className="font-medium">{step.count.toLocaleString()}</span>
            </div>
          </div>
          <div className="h-3.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0B2545] transition-all"
              style={{ width: `${(step.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
