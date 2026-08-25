declare module "react-simple-maps" {
  import { ComponentType, ReactNode } from "react"

  /** Minimal shape of a geography feature emitted by Geographies. */
  export interface GeographyFeature {
    rsmKey: string
    id?: string | number
    properties?: Record<string, unknown>
    [key: string]: unknown
  }

  export interface GeographyProps {
    geography?: unknown
    rsmKey?: string
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: React.CSSProperties
      hover?: React.CSSProperties
      pressed?: React.CSSProperties
    }
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void
    [key: string]: unknown
  }

  export interface ComposableMapProps {
    projectionConfig?: {
      rotate?: [number, number, number]
      scale?: number
      center?: [number, number]
      parallels?: [number, number]
    }
    projection?: string
    width?: number
    height?: number
    viewBox?: string
    className?: string
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: GeographyFeature[] }) => ReactNode
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
}
