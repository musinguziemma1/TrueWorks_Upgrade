declare module "react-simple-maps" {
  import { ComponentType, ReactNode } from "react"

  export interface GeographyProps {
    geography?: any
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
    [key: string]: any
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
    children: (props: { geographies: any[] }) => ReactNode
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
}
