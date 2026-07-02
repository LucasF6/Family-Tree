'use client'

import { PersonCardData } from "@/types";
import clsx from "clsx";

type RelationshipBaseProps = {
  screenPositionX: number;
  screenPositionY: number;
  clickable?: boolean;
  onClick?: () => void;
}

type RelationshipProps = 
  | RelationshipBaseProps & {
      type: "parent-child";
      parent: PersonCardData;
      child: PersonCardData;
    }
  | RelationshipBaseProps & {
      type: "partner-partner";
      firstPartner: PersonCardData;
      secondPartner: PersonCardData;
      children?: PersonCardData[];
    }
    
const personHeight = 60;

export default function Relationship(props: RelationshipProps) {
  
  const { type, screenPositionX, screenPositionY, clickable = false, onClick } = props

  let pathData: string[] = []
  switch (type) {
    case "parent-child":
      const { child, parent } = props
      pathData.push(
        `
          M ${child.positionX} ${child.positionY - personHeight / 2}
          C ${child.positionX} ${child.positionY - personHeight / 2 - 50},
            ${parent.positionX} ${parent.positionY + personHeight / 2 + 50},
            ${parent.positionX} ${parent.positionY + personHeight / 2}
        `
      )
      break
    case "partner-partner":
      let { firstPartner, secondPartner, children = [] } = props
      if (firstPartner.positionX > secondPartner.positionX) {
        [firstPartner, secondPartner] = [secondPartner, firstPartner]
      }
      pathData.push(
        `
          M ${firstPartner.positionX + firstPartner.width / 2} ${firstPartner.positionY}
          C ${firstPartner.positionX + firstPartner.width / 2 + 50} ${firstPartner.positionY},
            ${secondPartner.positionX - secondPartner.width / 2 - 50} ${secondPartner.positionY},
            ${secondPartner.positionX - secondPartner.width / 2} ${secondPartner.positionY}
        `
      )
      let positionX = 0.5 * (firstPartner.positionX + firstPartner.width / 2 + secondPartner.positionX - secondPartner.width / 2)
      let positionY = 0.5 * (firstPartner.positionY + secondPartner.positionY)
      pathData.push(...children.map(child => (
        `
          M ${positionX} ${positionY}
          C ${positionX} ${positionY + 50},
            ${child.positionX} ${child.positionY - personHeight / 2 - 50},
            ${child.positionX} ${child.positionY - personHeight / 2}
        `
      )))
      break
  }

  return (
    <svg
      className="absolute inset-0 overflow-visible"
      style={{
        transform: `translate(${screenPositionX}px, ${screenPositionY}px)`,
      }}
    >
      <g className="group" onPointerDown={() => onClick?.()}>
        {pathData.map((data, index) => (
          <g key={index}>
            <path
              key={`visible-path-${index}`}
              className={clsx("stroke-white", clickable && "group-hover:stroke-green-400")}
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