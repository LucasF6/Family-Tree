'use client'

import { RelationshipDraftData } from "@/types";
import styles from "./PersonLocationChooser.module.css"
import clsx from "clsx";
import { RelationshipPathDraft } from "@/components/RelationshipPath"

type PersonLocationChooserProps = {
  relationshipDraftData: RelationshipDraftData
  screenPositionX: number;
  screenPositionY: number;
  screenWidth: number; // used for animation
  screenHeight: number;
}

export default function PersonLocationChooser({ relationshipDraftData, screenPositionX, screenPositionY, screenWidth, screenHeight }: PersonLocationChooserProps) {
  const independent = relationshipDraftData.from === "none"

  return (
    <>
      {independent && (
        <div 
          className={clsx(
            styles.locationChooser,
            "bg-gray-600"
          )}
          style={{
            "--x": `${relationshipDraftData.newPerson.positionX + screenPositionX}px`,
            "--y": `${relationshipDraftData.newPerson.positionY + screenPositionY}px`,
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
          "--x": `${relationshipDraftData.newPerson.positionX + screenPositionX}px`,
          "--y": `${relationshipDraftData.newPerson.positionY + screenPositionY}px`,
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