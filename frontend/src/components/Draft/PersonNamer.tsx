'use client'

import { useState, useRef } from "react"
import styles from "./PersonNamer.module.css"
import { KeyboardEvent, ChangeEvent } from "react";
import RelationshipOptions from "@/components/RelationshipOptions";
import { Connection, Position } from "@/types/family-tree.types";

type PersonNamerProps = {
  position: Position
  includeConnections?: [Connection, Connection] | [Connection, Connection, Connection]
  onUpdateConnection: (connection: Connection) => void;
  onUpdateWidth: (width: number) => void;
  onSubmit: (name: string) => void;
  right?: boolean;
}

export default function PersonNamer({ position, onUpdateConnection, onUpdateWidth, onSubmit, right = false, includeConnections }: PersonNamerProps) {
  const [name, setName] = useState("")
  const [width, setWidth] = useState(80.02)
  const ref = useRef<HTMLDivElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      onSubmit(name)
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
    if (!ref.current) return
    const w = ref.current.getBoundingClientRect().width
    setWidth(w)
    onUpdateWidth?.(w)
  }

  function handleHover(connection: Connection) {
    onUpdateConnection(connection)
  }

  return (
    <>
      {includeConnections && (
        <RelationshipOptions 
          position={{
            x: right ? position.x + width / 2 + 70 + 20 : position.x - width / 2 - 70 - 20,
            y: position.y
          }}
          includeConnections={includeConnections}
          onClick={() => onSubmit(name)}
          onHover={handleHover}
          animation={right ? "right" : "left"}
        />
      )}
      <div
        className={styles.person}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`,
        }}
        ref={ref}
      >
        <input
          value={name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="name"
        />
      </div>
    </>
  );
}