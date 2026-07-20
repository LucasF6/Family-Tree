import { createContext } from "react"
import { Position } from "@/types/family-tree.types"

export type ViewportContextValue = {
  screenToWorld: (clientX: number, clientY: number) => Position
}

export const ViewportContext = createContext<ViewportContextValue | null>(null)
