'use client'

import clsx from "clsx";
import { getAveragePositionBetweenPartners, getChildToParentPath, getChildToPositionPath, getPartnerToPartnerPath } from "./paths";
import { Position, RelationshipData, } from "@/types/family-tree.types";
import { PointerEvent, useState, WheelEvent, MouseEvent } from "react"


type RelationshipPathProps = {
  data: RelationshipData
  disabled: boolean
  onClick: (position: Position) => void;
}

export function RelationshipPath({ data, onClick, disabled }: RelationshipPathProps) {
  const [strength, setStrength] = useState(50)

  const pathData: string[] = []
  const { parents, children } = data
  if (parents.length === 2) {
    const swapPartners: boolean = parents[0].position.x > parents[1].position.x
    pathData.push(getPartnerToPartnerPath(swapPartners ? parents[1] : parents[0], swapPartners ? parents[0] : parents[1], strength))
    const coupleAveragePosition: Position = getAveragePositionBetweenPartners(swapPartners ? parents[1] : parents[0], swapPartners ? parents[0] : parents[1])
    children.forEach(child => {
      pathData.push(getChildToPositionPath(child, coupleAveragePosition, strength))
    })
  } else {
    children.forEach(child => {
      pathData.push(getChildToParentPath(child, parents[0], strength))
    })
  }

  function handlePointerDown(e: PointerEvent<SVGGElement>) {
    if (disabled) return
    if (e.button === 0) {
      onClick({ x: e.clientX, y: e.clientY })
      e.stopPropagation()
    } else if (e.button === 2) {
      // dispatch delete option
    }
  }

  function handleWheel(e: WheelEvent<SVGGElement>) {
    if (disabled) return
    setStrength(prev => {
      const next = prev - 0.05 * e.deltaY
      if ((e.deltaY > 0 && next >= 10) || (e.deltaY < 0 && next <= 100)) {
        return next
      }
      return prev
    })
    e.stopPropagation()
  }

  function handleContextMenu(e: MouseEvent<SVGGElement>) {
    e.preventDefault()
  }

  return (
    <svg
      className="absolute inset-0 overflow-visible"
    >
      <g 
        className="group" 
        onPointerDown={handlePointerDown} 
        onWheel={handleWheel} 
        onContextMenu={handleContextMenu}
      >
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