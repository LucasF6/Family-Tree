'use client'

import { useState, useRef } from "react"
import styles from "./PersonNamer.module.css"
import { KeyboardEvent, ChangeEvent } from "react";
import { Connection, RealRelationshipDraft, RelationshipDraft } from "@/types";
import RelationshipOptions from "@/components/RelationshipOptions";
import { RelationshipPathDraft } from "../RelationshipPath";

type PersonNamerProps = {
  relationshipDraft: RelationshipDraft
  screenPositionX: number
  screenPositionY: number
  isConnected?: boolean;
  includeConnections?: [Connection] | [Connection, Connection] | [Connection, Connection, Connection]
  onUpdateConnection?: (connection: Connection) => void;
  onUpdateWidth?: (width: number) => void;
  onSubmit: (name: string) => void;
  right?: boolean;
}

export default function PersonNamer({ screenPositionX, screenPositionY, relationshipDraft, isConnected = false, onUpdateConnection, onUpdateWidth, onSubmit, right = false, includeConnections }: PersonNamerProps) {
  const [name, setName] = useState("")
  const [width, setWidth] = useState(80.02)
  const [connection, setConnection] = useState<Connection>("partner")
  const ref = useRef<HTMLDivElement>(null)

  const positionX = relationshipDraft.newPerson.positionX + screenPositionX
  const positionY = relationshipDraft.newPerson.positionY + screenPositionY

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (isConnected) {
        onSubmit(name)
      } else {
        onSubmit(name)
      }
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
    setConnection(connection)
    onUpdateConnection?.(connection)
  }

  return (
    <>
      {relationshipDraft.from !== "none" && <RelationshipPathDraft
        relationshipData={relationshipDraft}
        screenPositionX={screenPositionX}
        screenPositionY={screenPositionY}
      />}
      {isConnected && includeConnections && (
        <RelationshipOptions 
          positionX={right ? positionX + width / 2 + 70 + 20 : positionX - width / 2 - 70 - 20}
          positionY={positionY}
          includeConnections={includeConnections}
          onClick={() => onSubmit(name)}
          onHover={handleHover}
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