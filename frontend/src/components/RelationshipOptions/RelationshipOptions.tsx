'use client'

import { clsx } from "clsx";
import styles from "./RelationshipOptions.module.css"
import { Connection, Position } from "@/types/family-tree.types";

type RelationshipOptionsProps = {
  position: Position
  includeConnections: Connection[]
  onClick: (connection: Connection) => void;
  onHover: (connection: Connection) => void;
  animation?: "none" | "left" | "right";
}

const gridRows: Record<1 | 2 | 3, string> = {
  1: "grid-rows-1",
  2: "grid-rows-2",
  3: "grid-rows-3"
}

function connectionColor(connection: Connection) {
  switch (connection) {
    case "parent":
      return "bg-green-300 hover:bg-green-600"
    case "partner":
      return "bg-green-400 hover:bg-green-700"
    case "child":
      return "bg-green-500 hover:bg-green-800"
  }
}

function isOneTwoOrThree(value: number): value is 1 | 2 | 3 {
  return [1, 2, 3].includes(value)
}

export default function RelationshipOptions({ position, includeConnections, onClick, onHover, animation = "none" }: RelationshipOptionsProps) {
  if (!isOneTwoOrThree(includeConnections.length)) {
    return
  }

  return (
    <div
      className={clsx(
        gridRows[includeConnections.length], 
        styles.options,
        {
          [styles.playAnimationLeft]: animation === "left",
          [styles.playAnimationRight]: animation === "right" 
        }
      )}
      style={{
        "--x": `${position.x}px`,
        "--y": `${position.y}px`
      } as React.CSSProperties}
      onPointerDown={e => e.stopPropagation()}
    >
      {includeConnections.map((connection, idx) => (
        <button
          className={`${connectionColor(connection)} font-mono text-3xl h-13.75 select-none`}
          onClick={() => onClick(connection)}
          onMouseEnter={() => onHover(connection)}
          key={idx}
        >
          {connection}
        </button>
      ))}
    </div>
  )
}