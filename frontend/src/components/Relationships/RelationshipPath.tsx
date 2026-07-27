'use client'

import clsx from "clsx";
import { getAveragePositionBetweenPartners, getChildToParentPath, getChildToPositionPath, getPartnerToPartnerPath } from "./paths";
import { Position, RelationshipData, } from "@/types/family-tree.types";
import { PointerEvent, useState, WheelEvent, MouseEvent, useEffect, useRef } from "react"
import { useEditorStateDispatch } from "../FamilyTree";
import styles from "./RelationshipPath.module.css"

const defaultStrength: number = 50

type RelationshipPathProps = {
  data: RelationshipData
  disabled: boolean
  dotted?: boolean
  onClick?: (position: Position) => void;
}

export function RelationshipPath({ data, onClick, disabled, dotted = false }: RelationshipPathProps) {
  const dispatch = useEditorStateDispatch()
  const [previewStrength, setPreviewStrength] = useState<number | null>(null)
  const timeoutId = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutId.current !== null) {
        window.clearTimeout(timeoutId.current)
      }
    }
  }, [])

  const strength: number = previewStrength ?? data.strength ?? defaultStrength
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
      onClick?.({ x: e.clientX, y: e.clientY })
      e.stopPropagation()
    } else if (e.button === 2) {
      // dispatch delete option
    }
  }

  function handleWheel(e: WheelEvent<SVGGElement>) {
    if (disabled) {
      return
    }
    e.stopPropagation()
    const next = strength - 0.05 * e.deltaY
    if (next < 10 || next > 100) {
      return
    }

    
    if (timeoutId.current !== null) {
      window.clearTimeout(timeoutId.current)
    }
    
    timeoutId.current = window.setTimeout(() => {
      dispatch({
        type: "CHANGED_RELATIONSHIP_STRENGTH",
        relationshipId: data.id,
        strength: next
      })
      setPreviewStrength(null)
      timeoutId.current = null
    }, 500)

    setPreviewStrength(next)

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
              className={clsx(
                "stroke-white", 
                !disabled && "group-hover:stroke-green-400",
                dotted && styles.dottedPath
              )}
              pathLength="1"
              strokeWidth="2"
              fill="none"
              d={data}
            />
            <path
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