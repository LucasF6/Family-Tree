import { Position } from "@/types/family-tree.types";
import { PointerEvent, useRef, useEffect } from "react";

type CanvasProps = { 
  children: React.ReactNode,
  disabled: boolean,
  updateScreenPosition: (pos: Position) => void,
  updateCanvasDimensions: (width: number, height: number) => void,
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void,
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void
}

export default function Canvas({ children, disabled, updateScreenPosition, updateCanvasDimensions, onPointerDown, onPointerMove }: CanvasProps) {
  const isDragging = useRef(false)
  const dragOffset = useRef<Position>({x: 0, y: 0})
  const screenPosition = useRef<Position>({x: 0, y: 0})
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(([entry]) => {
      updateCanvasDimensions(entry.contentRect.width, entry.contentRect.height)
    })

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [updateCanvasDimensions])

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!disabled) {
      isDragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      dragOffset.current = {
        x: screenPosition.current.x - e.clientX,
        y: screenPosition.current.y - e.clientY
      }
    }
    onPointerDown(e)
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
      screenPosition.current = position
      updateScreenPosition(position)
    }
    onPointerMove(e)
  }
  
  return (
    <div
      className="w-dvw h-dvw"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      ref={ref}
    >
      {children}
    </div>
  )
}