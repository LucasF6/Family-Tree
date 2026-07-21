'use client'

import clsx from "clsx";
import { getAveragePositionBetweenPartners, getChildToParentPath, getChildToPositionPath, getPartnerToPartnerPath } from "./paths";
import { Position, RelationshipData, } from "@/types/family-tree.types";
import { PointerEvent } from "react"


type RelationshipPathProps = {
  data: RelationshipData
  disabled: boolean
  onClick: (position: Position) => void;
}

export function RelationshipPath({ data, onClick, disabled }: RelationshipPathProps) {
  const pathData: string[] = []
  const { parents, children } = data
  if (parents.length === 2) {
    const swapPartners: boolean = parents[0].position.x > parents[1].position.x
    pathData.push(getPartnerToPartnerPath(swapPartners ? parents[1] : parents[0], swapPartners ? parents[0] : parents[1]))
    const coupleAveragePosition: Position = getAveragePositionBetweenPartners(swapPartners ? parents[1] : parents[0], swapPartners ? parents[0] : parents[1])
    children.forEach(child => {
      pathData.push(getChildToPositionPath(child, coupleAveragePosition))
    })
  } else {
    children.forEach(child => {
      pathData.push(getChildToParentPath(child, parents[0]))
    })
  }

  function handlePointerDown(e: PointerEvent<SVGGElement>) {
    if (!disabled) {
      onClick({ x: e.clientX, y: e.clientY })
      e.stopPropagation()
    }
  }

  return (
    <svg
      className="absolute inset-0 overflow-visible"
    >
      <g className="group" onPointerDown={handlePointerDown}>
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