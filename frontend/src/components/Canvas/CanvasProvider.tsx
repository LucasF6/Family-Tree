import { Dimensions, Position } from "@/types/family-tree.types"
import { createContext, useContext } from "react"

export type CoordinatesContextValue = {
  screenToWorld: (position: Position) => Position
  worldToScreen: (position: Position) => Position
}

export type MousePositionContextValue = {
  get: () => Position
}

export const CoordinatesContext = createContext<CoordinatesContextValue | null>(null)
export const ViewportContext = createContext<Dimensions | null>(null)
export const MousePositionContext = createContext<MousePositionContextValue | null>(null)

export function useCoordinates() {
  const coordinates = useContext(CoordinatesContext)
  if (!coordinates) {
    throw new Error("coordinates context cannot be null")
  }
  return coordinates
}

export function useViewport() {
  const viewport = useContext(ViewportContext)
  if (!viewport) {
    throw new Error("viewport context cannot be null")
  }
  return viewport
}

export function useMousePosition() {
  const mousePosition = useContext(MousePositionContext)
  if (!mousePosition) {
    throw new Error("mouse position context can only be used in a mouse position context provider!")
  }
  return mousePosition
}

type CanvasContextProps = {
  children: React.ReactNode
  viewport: ScreenDimensions
  mousePosition: MousePositionContextValue
  coordinates: CoordinatesContextValue
}

export function CanvasProvider({ children, viewport, mousePosition, coordinates }: CanvasContextProps) {
  return (
    <ViewportContext value={viewport}>
      <MousePositionContext value={mousePosition}>
        <CoordinatesContext value={coordinates}>
          {children}
        </CoordinatesContext>
      </MousePositionContext>
    </ViewportContext>
  )
}
