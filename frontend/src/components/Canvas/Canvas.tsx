import { Dimensions, Position } from "@/types/family-tree.types";
import { PointerEvent, useRef, useEffect, useState } from "react";
import { CoordinatesContext, CoordinatesContextValue, ViewportContext } from "./context";

type CanvasProps = { 
  children: React.ReactNode
  overlay: React.ReactNode
  disabled: boolean
  onUpdateMousePosition: (position: Position) => void
  onUpdatePanPosition: (position: Position) => void
}

export default function Canvas({ children, overlay, disabled, onUpdateMousePosition, onUpdatePanPosition }: CanvasProps) {
  const isDragging = useRef(false)
  const dragOffset = useRef<Position>({ x: 0, y: 0 })
  const [panPosition, setPanPosition] = useState<Position>({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const [screenDimensions, setScreenDimensions] = useState<Dimensions | null>(null)

  const coordinates: CoordinatesContextValue = {
    screenToWorld(screenPosition: Position): Position {
      return {
        x: screenPosition.x - panPosition.x,
        y: screenPosition.y - panPosition.y
      }
    },
    worldToScreen(worldPosition: Position): Position {
      return {
        x: worldPosition.x + panPosition.x,
        y: worldPosition.y + panPosition.y
      }
    }
  }
  
  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(([entry]) => {
      setScreenDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      })
    })

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!disabled) {
      isDragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      dragOffset.current = {
        x: panPosition.x - e.clientX,
        y: panPosition.y - e.clientY
      }
    }
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    isDragging.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (isDragging.current) {
      const position = {
        x: e.clientX + dragOffset.current.x,
        y: e.clientY + dragOffset.current.y
      }
      setPanPosition(position)
      onUpdatePanPosition(position)
    }
    onUpdateMousePosition({
      x: e.clientX,
      y: e.clientY
    })
  }
  
  return (
    <ViewportContext value={screenDimensions}>
      <CoordinatesContext value={coordinates}>
        <div
          className="w-dvw h-dvw"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          ref={ref}
        >
          <div
            className="w-full h-full"
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px)`
            }}
          >
            {children}
          </div>
          {overlay}
        </div>
      </CoordinatesContext>
    </ViewportContext>
  )
}
