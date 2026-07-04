'use client'

import { PersonCardData, RelationshipDraftData } from "@/types";
import clsx from "clsx";
import { getAveragePositionBetweenPartners, getChildToParentPath, getChildToPositionPath, getPartnerToPartnerPath } from "./paths";

type RelationshipProps = {
  screenPositionX: number;
  screenPositionY: number;
  relationshipData: RelationshipDraftData
}
    
const personHeight = 60;



export function RelationshipPathDraft({ screenPositionX, screenPositionY, relationshipData }: RelationshipProps) {
  const pathData: string[] = []
  switch (relationshipData.from) {
    case "parent-child": {
      const { parent, newPerson } = relationshipData
      pathData.push(getChildToParentPath(newPerson, parent))
      break
    }
    case "couple": {
      let { firstPartner, secondPartner, newPerson } = relationshipData
      if (firstPartner.positionX > secondPartner.positionX) {
        [firstPartner, secondPartner] = [secondPartner, firstPartner]
      }
      let [positionX, positionY] = getAveragePositionBetweenPartners(firstPartner, secondPartner)
      pathData.push(getChildToPositionPath(newPerson, positionX, positionY))
      break
    }
    case "partner": {
      let { partner, newPerson } = relationshipData
      if (partner.positionX > newPerson.positionX) {
        [partner, newPerson] = [newPerson, partner]
      }
      pathData.push(getPartnerToPartnerPath(partner, newPerson))
      break
    }
    case "child": {
      let { child, newPerson } = relationshipData
      pathData.push(getChildToParentPath(child, newPerson))
      break
    }
    case "parent": {
      let { parent, newPerson } = relationshipData
      pathData.push(getChildToParentPath(newPerson, parent))
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
      <g className="group">
        {pathData.map((data, index) => (
          <g key={index}>
            <path
              key={`visible-path-${index}`}
              className={clsx("stroke-white")}
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