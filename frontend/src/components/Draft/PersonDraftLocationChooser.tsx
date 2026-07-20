'use client'

import styles from "./PersonDraftLocationChooser.module.css"
import clsx from "clsx";
import { useEffect, useState, useRef, useContext } from "react"
import { Position } from "@/types/family-tree.types";
import { useCoordinates, CoordinatesContext, useViewport } from "@/components/Canvas/context";

type PersonDraftLocationChooserProps = {
  initialPosition: Position
  hasShadow: boolean
  onChooseLocation: (position: Position) => void
  onUpdatePosition: (position: Position) => void
}

export function PersonDraftLocationChooser({ initialPosition, hasShadow, onChooseLocation, onUpdatePosition }: PersonDraftLocationChooserProps) {
  const [position, setPosition] = useState<Position>(initialPosition)
  const positionRef = useRef(position)

  const coordinates = useCoordinates()
  const viewport = useViewport()

  const startPosition = coordinates.screenToWorld({
    x: viewport.width / 2,
    y: viewport.height / 2
  })

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    function handlePointerDown() {
      onChooseLocation(positionRef.current)
    }

    function handlePointerMove(e: PointerEvent) {
      const myPosition = {
        x: e.clientX,
        y: e.clientY
      }
      const newPosition = coordinates.screenToWorld(myPosition)

      setPosition(newPosition)
      onUpdatePosition(newPosition)
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("pointermove", handlePointerMove)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("pointermove", handlePointerMove)
    }
  }, [onChooseLocation])

  return (
    <>
      {hasShadow && (
        <div 
          className={clsx(
            styles.locationChooser,
            "bg-gray-600"
          )}
          style={{
            "--x": `${position.x}px`,
            "--y": `${position.y}px`,
          } as React.CSSProperties}
        />
      )}
      <div 
        className={clsx(
          styles.locationChooser,
          "bg-[rgb(129,255,129)]",
          hasShadow ? styles.playFromCenterAnimation : styles.playGrowAnimation
        )}
        style={{
          "--x": `${position.x}px`,
          "--y": `${position.y}px`,
          ...(hasShadow && {
            "--init-x": `${startPosition.x}px`,
            "--init-y": `${startPosition.y}px`
          })
        } as React.CSSProperties}
      />
    </>
  )
}