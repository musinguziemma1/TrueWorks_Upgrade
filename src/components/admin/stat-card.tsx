"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardDelta {
  /** Signed percentage change (e.g. 12.5 for "+12.5%"). */
  value: number;
  /** Caption rendered next to the delta sign (e.g. "vs last 7d"). */
  label?: string;
  /** Flat caption used when the change is ~0. Defaults to "flat". */
  flatLabel?: string;
  /**
   * When a *negative* change is the good outcome set this to true so the
   * pill is colourised green on negative and red on positive.
   */
  invert?: boolean;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Icon chip tint — pass the *text* color and a matching *bg* color. */
  tint?: string;
  href?: string;
  delta?: StatCardDelta;
  footnote?: string;
  loading?: boolean;
}

/**
 * Premium KPI card used throughout the admin. Renders as an `<a>` when
 * `href` is provided, otherwise as a static tile. Deltas are colourised by
 * intent so an operator can scan the numbers at a glance.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tint = "text-primary bg-primary/10",
  href,
  delta,
  footnote,
  loading = false,
}: StatCardProps) {
  const hasDelta = delta !== undefined && !loading;
  const raw = delta?.value ?? 0;
  const positive = raw >= 0;
  const good = delta?.invert ? !positive : positive;
  const isFlat = Math.abs(raw) < 0.05;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="h-9 w-9 rounded-lg" />
        ) : (
          <span
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover/card:scale-105",
              tint
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <p className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
          {value}
        </p>
      )}

      {loading ? (
        <Skeleton className="mt-3 h-4 w-36" />
      ) : (
        <div className="mt-2 flex min-h-[1.25rem] flex-wrap items-center gap-1.5 text-xs">
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
                isFlat
                  ? "bg-muted text-muted-foreground"
                  : good
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
              )}
            >
              {isFlat ? (
                "≈"
              ) : positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>
                {isFlat
                  ? (delta?.flatLabel ?? "flat")
                  : `${Math.abs(raw).toFixed(0)}%`}
              </span>
              {delta.label ? (
                <span className="font-normal text-muted-foreground">
                  {delta.label}
                </span>
              ) : null}
            </span>
          )}
          {footnote ? (
            <span className="text-muted-foreground">{footnote}</span>
          ) : null}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Card
        size="sm"
        className="group/card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
      >
        <CardContent>
          <Link
            href={href}
            className="block rounded-lg focus-visible:outline-none"
          >
            {inner}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="transition-shadow duration-200">
      <CardContent>{inner}</CardContent>
    </Card>
  );
}