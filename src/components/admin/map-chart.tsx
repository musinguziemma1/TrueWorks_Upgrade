"use client"

import { memo, useState } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps"
import { getCountryId } from "@/lib/country-codes"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

export interface GeoMapData {
  country: string
  orders: number
  revenue: number
  regions?: { name: string; count: number }[]
}

const ATLAS_NAME_OVERRIDES: Record<string, string> = {
  "United States": "United States of America",
  "USA": "United States of America",
  "US": "United States of America",
  "UK": "United Kingdom",
  "England": "United Kingdom",
  "DRC": "Democratic Republic of the Congo",
  "Dem. Rep. Congo": "Democratic Republic of the Congo",
  "Congo": "Republic of the Congo",
  "Rep. Congo": "Republic of the Congo",
  "Ivory Coast": "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  "Burma": "Myanmar",
  "South Korea": "South Korea",
  "North Korea": "North Korea",
  "East Timor": "Timor-Leste",
  "Czech Republic": "Czech Republic",
  "Swaziland": "Eswatini",
  "Macedonia": "North Macedonia",
  "Palestine": "Palestine",
  "West Bank": "Palestine",
  "Gaza Strip": "Palestine",
  "Vatican City": "Vatican City",
  "Brunei": "Brunei Darussalam",
  "Russia": "Russia",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Trinidad and Tobago": "Trinidad and Tobago",
  "Solomon Islands": "Solomon Islands",
  "Marshall Islands": "Marshall Islands",
  "Saint Kitts and Nevis": "Saint Kitts and Nevis",
  "Saint Lucia": "Saint Lucia",
  "Saint Vincent and the Grenadines": "Saint Vincent and the Grenadines",
  "São Tomé and Príncipe": "São Tomé and Príncipe",
  "Eq. Guinea": "Equatorial Guinea",
  "W. Sahara": "Western Sahara",
  "Falkland Islands": "Falkland Islands",
}

function normalizeCountryName(name: string): string {
  return ATLAS_NAME_OVERRIDES[name] ?? name
}

function getColorScale(value: number, max: number): string {
  if (max === 0) return "#E5E7EB"
  const ratio = value / max
  if (ratio > 0.75) return "#0B2545"
  if (ratio > 0.5) return "#1a3a5c"
  if (ratio > 0.25) return "#4A6FA5"
  if (ratio > 0.1) return "#7B9CC2"
  return "#C9D6E8"
}

interface MapChartProps {
  data: GeoMapData[]
}

function MapChartInner({ data }: MapChartProps) {
  const [tooltip, setTooltip] = useState<{
    name: string
    orders: number
    revenue: number
    x: number
    y: number
  } | null>(null)

  const dataMap = new Map(data.map((d) => [normalizeCountryName(d.country), d]))
  const maxOrders = Math.max(...data.map((d) => d.orders), 1)

  const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
    return `$${v.toLocaleString()}`
  }

  return (
    <div className="relative w-full">
      <ComposableMap
        projectionConfig={{
          rotate: [-10, 0, 0],
          scale: 147,
        }}
        className="w-full h-auto"
        viewBox="0 0 800 450"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => {
              const geoName =
                (geo.properties as { name?: string })?.name ?? ""
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
        {["#C9D6E8", "#7B9CC2", "#4A6FA5", "#1a3a5c", "#0B2545"].map(
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

export const MapChart = memo(MapChartInner)
