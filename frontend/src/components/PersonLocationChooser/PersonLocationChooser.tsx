'use client'

import { RelationshipDraftData } from "@/types";
import styles from "./PersonLocationChooser.module.css"
import clsx from "clsx";
import { RelationshipPathDraft } from "@/components/RelationshipPath"
import { useEffect, useState, useRef } from "react"
import { Position } from "@/types/family-tree.types";

type PersonLocationChooserProps = {
  relationshipDraftData: RelationshipDraftData
  initialPosition: Position
  screenPositionX: number;
  screenPositionY: number;
  screenWidth: number; // used for animation
  screenHeight: number;
  onChooseLocation: (pos: Position) => void
}

export default function PersonLocationChooser({ relationshipDraftData, initialPosition, screenPositionX, screenPositionY, screenWidth, screenHeight, onChooseLocation }: PersonLocationChooserProps) {
  const [position, setPosition] = useState<Position>(initialPosition)
  const positionRef = useRef(position)
  
  const independent = relationshipDraftData.from === "none"

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      onChooseLocation(positionRef.current)
    }

    function handlePointerMove(e: PointerEvent) {
      setPosition({
        x: e.clientX - screenPositionX,
        y: e.clientY - screenPositionY
      })
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("pointermove", handlePointerMove)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("pointermove", handlePointerMove)
    }
  }, [onChooseLocation, screenPositionX, screenPositionY])

  return (
    <>
      {independent && (
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
          independent ? styles.playFromCenterAnimation : styles.playGrowAnimation
        )}
        style={{
          "--x": `${position.x}px`,
          "--y": `${position.y}px`,
          ...(independent && {
            "--init-x": `${screenWidth / 2}px`,
            "--init-y": `${screenHeight / 2}px`
          })
        } as React.CSSProperties}
      />
      {!independent && (
        <RelationshipPathDraft
          relationshipData={relationshipDraftData}
          screenPositionX={screenPositionX}
          screenPositionY={screenPositionY}
        />
      )}
    </>
  )
}