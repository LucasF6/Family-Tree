import { Dimensions, Position } from "@/types/family-tree.types";
import { PointerEvent, useRef, useEffect, useState, WheelEvent } from "react";
import { CanvasProvider, CoordinatesContext, CoordinatesContextValue, MousePositionContextValue, ViewportContext } from "./CanvasProvider";
import KeyboardShortcuts from "../KeyboardShortcuts";

type CanvasProps = { 
  children: React.ReactNode
  overlay: React.ReactNode
  disabled: boolean
}

export default function Canvas({ children, overlay, disabled }: CanvasProps) {
  const isDragging = useRef(false)
  const dragOffset = useRef<Position>({ x: 0, y: 0 })
  const panRef = useRef<Position>({ x: 0, y: 0 })
  const [panPosition, setPanPosition] = useState<Position>({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<Dimensions | null>(null)
  const mousePosition = useRef<Position>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)

  const coordinates: CoordinatesContextValue = {
    screenToWorld(screenPosition: Position): Position {
      return {
        x: (screenPosition.x - panRef.current.x) / zoomRef.current,
        y: (screenPosition.y - panRef.current.y) / zoomRef.current
      }
    },
    worldToScreen(worldPosition: Position): Position {
      return {
        x: panRef.current.x + zoomRef.current * worldPosition.x,
        y: panRef.current.y + zoomRef.current * worldPosition.y
      }
    }
  }

  const mousePos: MousePositionContextValue = {
    get: () => mousePosition.current
  }

  useEffect(() => {
    panRef.current = panPosition
  }, [panPosition])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])
  
  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(([entry]) => {
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      })
    })

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!disabled && e.button === 0) {
      isDragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      dragOffset.current = coordinates.screenToWorld({
        x: e.clientX,
        y: e.clientY
      })
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
      const mouseWorldPosition = coordinates.screenToWorld({
        x: e.clientX,
        y: e.clientY
      })
      setPanPosition(coordinates.worldToScreen({
        x: mouseWorldPosition.x - dragOffset.current.x,
        y: mouseWorldPosition.y - dragOffset.current.y
      }))
    }
    mousePosition.current = {
      x: e.clientX,
      y: e.clientY
    }
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    const ratio = Math.exp(-e.deltaY / 1000)
    setZoom(prev => prev * ratio)
    setPanPosition(prev => ({
      x: e.clientX * (1 - ratio) + prev.x * ratio,
      y: e.clientY * (1 - ratio) + prev.y * ratio
    }))
  }
  
  return (
    <CanvasProvider
      viewport={viewport ?? { width: 0, height: 0 }}
      coordinates={coordinates}
      mousePosition={mousePos}
    >
      <div
        className="w-dvw h-dvw"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onWheel={handleWheel}
        ref={ref}
      >
        <div
          className="w-full h-full"
          style={{
            transformOrigin: `0 0`,
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom})`
          }}
        >
          {children}
        </div>
        {overlay}
        <KeyboardShortcuts />
      </div>
    </CanvasProvider>
  )
}
