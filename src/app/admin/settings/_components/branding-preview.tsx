"use client"

import { useMemo } from "react"
import { ShoppingCart, Menu } from "lucide-react"
import type { SettingsValues } from "../use-settings-form"

const fontMap: Record<string, string> = {
  georgia: "Georgia, 'Times New Roman', serif",
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  calibri: "Calibri, Source Sans 3, ui-sans-serif, system-ui, sans-serif",
  opensans: "'Open Sans', ui-sans-serif, system-ui, sans-serif",
}

export function BrandingPreview({ values }: { values: SettingsValues }) {
  const { primary, secondary, accent, background, surface, foreground, heading, body } = useMemo(() => {
    const primary = String(values.primaryColor ?? "#0B2545")
    const secondary = String(values.secondaryColor ?? "#3E6990")
    const accent = String(values.accentColor ?? "#C9A227")
    const background = String(values.backgroundColor ?? "#FFFFFF")
    const surface = String(values.surfaceColor ?? "#FAFBFC")
    const foreground = String(values.foregroundColor ?? "#1E293B")
    const heading = fontMap[String(values.headingFont ?? "georgia")] ?? fontMap.georgia
    const body = fontMap[String(values.bodyFont ?? "calibri")] ?? fontMap.calibri
    return { primary, secondary, accent, background, surface, foreground, heading, body }
  }, [values])

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Mini browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-green-400" />
        <span className="ml-2 h-4 flex-1 max-w-56 rounded bg-background border border-border text-[10px] px-2 text-muted-foreground leading-tight">
          trueworksgroup.com
        </span>
      </div>

      {/* Site mockup */}
      <div style={{ backgroundColor: background, color: foreground, fontFamily: body }}>
        {/* Navbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ backgroundColor: surface, borderColor: `${foreground}14` }}>
          <div className="flex items-center gap-2">
            <Menu className="size-4" style={{ color: foreground }} />
            <span className="text-sm font-bold" style={{ fontFamily: heading, color: foreground }}>
              {String(values.siteName ?? "TrueWorks")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs">Shop</span>
            <span className="text-xs">About</span>
            <span className="flex items-center gap-1 rounded px-2 py-1 text-xs" style={{ backgroundColor: primary, color: background }}>
              <ShoppingCart className="size-3" />
              Cart
            </span>
          </div>
        </div>

        {/* Hero */}
        <div className="px-4 py-5">
          <p className="text-xs mb-1" style={{ color: secondary }}>
            {String(values.siteTagline ?? "Digital Products Marketplace")}
          </p>
          <h1 className="text-xl font-bold" style={{ fontFamily: heading, color: foreground }}>
            {String(values.siteDescription ?? "Premium digital products").slice(0, 42)}
          </h1>

          {/* Sample UI elements */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: primary, color: background }}>
              Primary Button
            </span>
            <span className="rounded px-3 py-1.5 text-xs font-semibold border" style={{ borderColor: accent, color: accent }}>
              Accent Outline
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="h-3 w-8 rounded-sm" style={{ backgroundColor: primary }} />
            <span className="h-3 w-8 rounded-sm" style={{ backgroundColor: secondary }} />
            <span className="h-3 w-8 rounded-sm" style={{ backgroundColor: accent }} />
            <span className="h-3 w-8 rounded-sm" style={{ backgroundColor: background, border: "1px solid #e2e8f0" }} />
          </div>

          <p className="mt-3 text-[11px]" style={{ color: foreground, opacity: 0.7 }}>
            Heading font: {heading.split(",")[0]} · Body font: {body.split(",")[0]}
          </p>
        </div>
      </div>
    </div>
  )
}
