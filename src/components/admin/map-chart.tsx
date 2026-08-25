"use client"

import { memo, useEffect, useState } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps"
const GEO_URL = "/countries-110m.json"

export interface GeoMapData {
  country: string
  orders: number
  revenue: number
  regions?: { name: string; count: number }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Topology = Record<string, any>

const ATLAS_NAME_OVERRIDES: Record<string, string> = {
  "United States": "United States of America",
  "USA": "United States of America",
  "UK": "United Kingdom",
  "England": "United Kingdom",
  "DRC": "Democratic Republic of the Congo",
  "Congo": "Republic of the Congo",
  "Ivory Coast": "Côte d'Ivoire",
  "Burma": "Myanmar",
  "East Timor": "Timor-Leste",
  "Swaziland": "Eswatini",
  "Macedonia": "North Macedonia",
  "Palestine": "Palestine",
  "West Bank": "Palestine",
  "Gaza Strip": "Palestine",
}

function normalizeCountryName(name: string): string {
  return ATLAS_NAME_OVERRIDES[name] ?? name
}

function getColorScale(value: number, max: number): string {
  if (max === 0) return "#E5E7EB"
  const ratio = value / max
  if (ratio > 0.75) return "#0B2545"
  if (ratio > 0.5) return "#071A33"
  if (ratio > 0.25) return "#3E6990"
  if (ratio > 0.1) return "#3E6990"
  return "#8FB3CC"
}

interface MapChartProps {
  data: GeoMapData[]
}

function MapChartInner({ data }: MapChartProps) {
  const [topology, setTopology] = useState<Topology | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{
    name: string
    orders: number
    revenue: number
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((json) => setTopology(json as Topology))
      .catch((e) => setError(String(e)))
  }, [])

  const dataMap = new Map(data.map((d) => [normalizeCountryName(d.country), d]))
  const maxOrders = Math.max(...data.map((d) => d.orders), 1)

  const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
    return `$${v.toLocaleString()}`
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Globe className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-destructive">Failed to load map data</p>
        <p className="text-xs text-muted-foreground/70 mt-1">{error}</p>
      </div>
    )
  }

  if (!topology) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A227]" />
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: "800 / 450" }}>
      <ComposableMap
        projectionConfig={{
          rotate: [-10, 0, 0],
          scale: 147,
        }}
        viewBox="0 0 800 450"
      >
        <Geographies geography={topology}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const geoName =
                (geo.properties as { name?: string } | undefined)?.name ?? ""
              const match = dataMap.get(geoName)
              const fill = match
                ? getColorScale(match.orders, maxOrders)
                : "#E5E7EB"

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#fff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      outline: "none",
                      fill: match ? "#C9A227" : "#D1D5DB",
                      cursor: match ? "pointer" : "default",
                    },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                    if (match) {
                      const rect = (
                        e.target as HTMLElement
                      ).getBoundingClientRect()
                      setTooltip({
                        name: match.country,
                        orders: match.orders,
                        revenue: match.revenue,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                      })
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="fixed z-50 bg-[#0B2545] text-white rounded-lg px-3 py-2 shadow-lg text-sm pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="font-semibold">{tooltip.name}</p>
          <p className="text-xs opacity-80">
            {tooltip.orders} order{tooltip.orders !== 1 ? "s" : ""} &middot;{" "}
            {formatRevenue(tooltip.revenue)}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground justify-center">
        <span>Less</span>
        {["#8FB3CC", "#3E6990", "#3E6990", "#071A33", "#0B2545"].map(
          (c) => (
            <div
              key={c}
              className="w-4 h-3 rounded-sm"
              style={{ backgroundColor: c }}
            />
          )
        )}
        <span>More</span>
      </div>
    </div>
  )
}

function Globe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

export const MapChart = memo(MapChartInner)
