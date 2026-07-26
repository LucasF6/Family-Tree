import { Dimensions, Position } from "@/types/family-tree.types";
import { PointerEvent, useRef, useEffect, useState, WheelEvent } from "react";
import { CanvasProvider, CoordinatesContext, CoordinatesContextValue, MousePositionContextValue, ViewportContext } from "./CanvasProvider";
import KeyboardShortcuts from "../KeyboardShortcuts";

type Camera = {
  panX: number,
  panY: number,
  zoom: number
}

type CanvasProps = { 
  children: React.ReactNode
  overlay: React.ReactNode
  keyboardShortcuts: React.ReactNode
  disabled: boolean
}

export default function Canvas({ children, overlay, keyboardShortcuts, disabled }: CanvasProps) {
  const invariantPosition = useRef<Position | null>(null) // The user is dragging the canvas if this is non-null
  const canvasRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<Dimensions | null>(null)
  const mousePosition = useRef<Position>({ x: 0, y: 0 })
  const [camera, setCamera] = useState<Camera>({ panX: 0, panY: 0, zoom: 1 })
  const cameraRef = useRef<Camera>(camera)

  const coordinates: CoordinatesContextValue = {
    screenToWorld(screenPosition: Position): Position {
      return {
        x: (screenPosition.x - cameraRef.current.panX) / cameraRef.current.zoom,
        y: (screenPosition.y - cameraRef.current.panY) / cameraRef.current.zoom
      }
    },
    worldToScreen(worldPosition: Position): Position {
      return {
        x: cameraRef.current.panX + cameraRef.current.zoom * worldPosition.x,
        y: cameraRef.current.panY + cameraRef.current.zoom * worldPosition.y
      }
    }
  }

  const mousePos: MousePositionContextValue = {
    get: () => mousePosition.current
  }

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])
  
  useEffect(() => {
    if (!canvasRef.current) return

    const observer = new ResizeObserver(([entry]) => {
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      })
    })

    observer.observe(canvasRef.current)

    return () => observer.disconnect()
  }, [])

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!disabled && e.button === 0) {
      e.currentTarget.setPointerCapture(e.pointerId)
      invariantPosition.current = coordinates.screenToWorld({
        x: e.clientX,
        y: e.clientY
      })
    }
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    invariantPosition.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    setCamera(prev => {
      if (!invariantPosition.current) {
        return prev
      }
      return {
        panX: e.clientX - prev.zoom * invariantPosition.current.x,
        panY: e.clientY - prev.zoom * invariantPosition.current.y,
        zoom: prev.zoom
      }
    })
    mousePosition.current = {
      x: e.clientX,
      y: e.clientY
    }
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    setCamera(prev => {
      const ratio = Math.exp(-e.deltaY / 1000)
      return {
        panX: e.clientX * (1 - ratio) + prev.panX * ratio,
        panY: e.clientY * (1 - ratio) + prev.panY * ratio,
        zoom: prev.zoom * ratio
      }
    })
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
        ref={canvasRef}
      >
        <div
          className="w-full h-full"
          style={{
            transformOrigin: `0 0`,
            transform: `translate(${camera.panX}px, ${camera.panY}px) scale(${camera.zoom})`
          }}
        >
          {children}
        </div>
        {overlay}
        {keyboardShortcuts}
      </div>
    </CanvasProvider>
  )
}
