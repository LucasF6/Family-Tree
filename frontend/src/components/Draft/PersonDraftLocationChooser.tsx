'use client'

import styles from "./PersonDraftLocationChooser.module.css"
import clsx from "clsx";
import { useEffect, useState, useRef, useContext } from "react"
import { Position } from "@/types/family-tree.types";
import { useCoordinates, useViewport } from "@/components/Canvas/CanvasProvider";

type PersonDraftLocationChooserProps = {
  position: Position
  hasShadow: boolean
}

export function PersonDraftLocationChooser({ position, hasShadow }: PersonDraftLocationChooserProps) {
  const coordinates = useCoordinates()
  const viewport = useViewport()

  const startPosition = coordinates.screenToWorld({
    x: viewport.width / 2,
    y: viewport.height / 2
  })

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
          hasShadow && styles.playFromCenterAnimation
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