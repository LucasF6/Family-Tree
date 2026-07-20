import { Dimensions, Position } from "@/types/family-tree.types"
import { createContext, useContext } from "react"

export type CoordinatesContextValue = {
  screenToWorld: (position: Position) => Position
  worldToScreen: (position: Position) => Position
}

export const CoordinatesContext = createContext<CoordinatesContextValue | null>(null)
export const ViewportContext = createContext<Dimensions | null>(null)

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
