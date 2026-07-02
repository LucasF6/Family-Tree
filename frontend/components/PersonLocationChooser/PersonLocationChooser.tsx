'use client'

import { PersonCardData } from "@/types";
import styles from "./PersonLocationChooser.module.css"
import clsx from "clsx";
import Relationship from "@/components/Relationship";

type PersonLocationChooserProps = {
  screenPositionX: number;
  screenPositionY: number;
  newPersonData: PersonCardData;
  isConnected: boolean;
  personConnectingData: PersonCardData | null;
  screenWidth?: number; // used for animation
  screenHeight?: number;
}

export default function PersonLocationChooser(props: PersonLocationChooserProps) {
  const { screenPositionX, screenPositionY, newPersonData, isConnected } = props

  return (
    <>
      {!isConnected && (
        <div 
          className={clsx(
            styles.locationChooser,
            "bg-gray-600"
          )}
          style={{
            "--x": `${newPersonData.positionX + screenPositionX}px`,
            "--y": `${newPersonData.positionY + screenPositionY}px`,
          } as React.CSSProperties}
        />
      )}
      <div 
        className={clsx(
          styles.locationChooser,
          "bg-[rgb(129,255,129)]",
          isConnected ? styles.playGrowAnimation : styles.playFromCenterAnimation
        )}
        style={{
          "--x": `${newPersonData.positionX + screenPositionX}px`,
          "--y": `${newPersonData.positionY + screenPositionY}px`,
          ...(!isConnected && {
            "--init-x": `${(props.screenWidth || 0) / 2}px`,
            "--init-y": `${(props.screenHeight || 0) / 2}px`
          })
        } as React.CSSProperties}
      />
      {isConnected && props.personConnectingData && (
        <Relationship 
          type="partner-partner"
          firstPartner={props.personConnectingData}
          secondPartner={newPersonData}
          screenPositionX={screenPositionX}
          screenPositionY={screenPositionY}
        />
      )}
    </>
  )
}