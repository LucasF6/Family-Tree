'use client'

import { PersonCardData, RelationshipData } from "@/src/types";
import clsx from "clsx";
import { getAveragePositionBetweenPartners, getChildToParentPath, getChildToPositionPath, getPartnerToPartnerPath } from "./paths";


type RelationshipProps = {
  screenPositionX: number;
  screenPositionY: number;
  onClick: () => void;
  relationshipData: RelationshipData
  disabled: boolean
}

export function RelationshipPath({relationshipData, screenPositionX, screenPositionY, onClick, disabled }: RelationshipProps) {
  const pathData: string[] = []
  switch (relationshipData.type) {
    case "parent-child": {
      const { child, parent } = relationshipData
      pathData.push(getChildToParentPath(child, parent))
      break
    }
    case "couple": {
      let { firstPartner, secondPartner, children = [] } = relationshipData
      if (firstPartner.positionX > secondPartner.positionX) {
        [firstPartner, secondPartner] = [secondPartner, firstPartner]
      }
      pathData.push(getPartnerToPartnerPath(firstPartner, secondPartner))
      let [positionX, positionY] = getAveragePositionBetweenPartners(firstPartner, secondPartner)
      pathData.push(...children.map(child => getChildToPositionPath(child, positionX, positionY)))
      break
    }
  }

  return (
    <svg
      className="absolute inset-0 overflow-visible"
      style={{
        transform: `translate(${screenPositionX}px, ${screenPositionY}px)`,
      }}
    >
      <g className="group" onPointerDown={() => {if (!disabled) onClick()}}>
        {pathData.map((data, index) => (
          <g key={index}>
            <path
              key={`visible-path-${index}`}
              className={clsx("stroke-white", !disabled && "group-hover:stroke-green-400")}
              strokeWidth="2"
              fill="none"
              d={data}
            />
            <path
              key={`hitbox-path-${index}`}
              className="stroke-transparent"
              strokeWidth="16"
              fill="none"
              d={data}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}