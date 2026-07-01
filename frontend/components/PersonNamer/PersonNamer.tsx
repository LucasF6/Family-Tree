'use client'

import { useState, useRef } from "react"
import styles from "./PersonNamer.module.css"
import { KeyboardEvent, ChangeEvent } from "react";
import { Connection } from "@/types";
import RelationshipOptions from "@/components/RelationshipOptions";

type PersonNamerProps = {
  positionX: number;
  positionY: number;
  isConnected?: boolean;
  onUpdateConnection: (connection: Connection) => void;
  onUpdateWidth: (width: number) => void;
  onSubmit: (connection: Connection, name: string) => void;
  right?: boolean;
}

export default function PersonNamer({ positionX, positionY, isConnected = false, onUpdateConnection, onUpdateWidth, onSubmit, right = false }: PersonNamerProps) {
  const [name, setName] = useState("")
  const [width, setWidth] = useState(80.02)
  const ref = useRef<HTMLDivElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !isConnected) {
      onSubmit("none", name)
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
    if (!ref.current) return
    const w = ref.current.getBoundingClientRect().width
    setWidth(w)
    onUpdateWidth(w)
  }

  return (
    <>
      {isConnected && (
        <RelationshipOptions 
          positionX={right ? positionX + width / 2 + 70 + 20 : positionX - width / 2 - 70 - 20}
          positionY={positionY}
          includeConnections={["parent", "partner", "child"]}
          onClick={connection => onSubmit(connection, name)}
          onHover={connection => onUpdateConnection(connection)}
          animation={right ? "right" : "left"}
        />
      )}
      <div
        className={styles.person}
        style={{
          transform: `translate(${positionX}px, ${positionY}px) translate(-50%, -50%)`,
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