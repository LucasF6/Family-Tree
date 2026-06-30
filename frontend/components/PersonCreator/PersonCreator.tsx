
import { useState, useRef } from "react"
import styles from "./PersonCreator.module.css"
import { KeyboardEvent, ChangeEvent } from "react";
import { Connection } from "@/types";

type PersonCreatorProps = {
  positionX: number;
  positionY: number;
  isConnected?: boolean;
  onUpdateConnection: (connection: Connection) => void;
  onUpdateWidth: (width: number) => void;
  onSubmit: (connection: Connection, name: string) => void;
  left?: boolean;
}

export default function PersonCreator({ positionX, positionY, isConnected = false, onUpdateConnection, onUpdateWidth, onSubmit, left = false }: PersonCreatorProps) {
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
        <div 
          className={styles.options}
          style={{
            "--x": left ? `${positionX + width / 2 + 70 + 20}px` : `${positionX - width / 2 - 70 - 20}px`,
            "--y": `${positionY}px`,
            "--left": left ? -1 : 1
          } as React.CSSProperties}
          onPointerDown={e => e.stopPropagation()}
        >
          <button
            className="bg-green-300 hover:bg-green-600 font-mono text-3xl"
            onClick={() => onSubmit("parent", name)}
            onMouseEnter={() => onUpdateConnection("parent")}
          >
            Parent
          </button>
          <button
            className="bg-green-400 hover:bg-green-700 font-mono text-3xl"
            onClick={() => onSubmit("partner", name)}
            onMouseEnter={() => onUpdateConnection("partner")}
          >
            Partner
          </button>
          <button
            className="bg-green-500 hover:bg-green-800 font-mono text-3xl"
            onClick={() => onSubmit("child", name)}
            onMouseEnter={() => onUpdateConnection("child")}
          >
            Child
          </button>
        </div>
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