'use client'

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { PointerEvent } from "react"
import styles from "./Person.module.css"

const DRAG_THRESHOLD = 3; // 3px

/**
 * draggable: the element can be dragged around the screen
 * 
 * connectable: a possible second person in a connection of two people
 * 
 * disabled: no functionality
 * 
 * options: options buble is popped open
*/
type PersonProps = {
  name: string;
  positionX: number;
  positionY: number;
  updatePosition: (x: number, y: number) => void;
  updateWidth: (width: number) => void;
  mode?: "draggable" | "connectable" | "disabled" | "options";
  onClick: () => void;
  onOptions: () => void;
  onConnect: (clientX: number, clientY: number) => void;
};

type OptionsBubbleProps = {
  positionX: number;
  positionY: number;
  open?: boolean;
  onConnect: (clientX: number, clientY: number) => void;
  onEdit?: () => void;
  onPage?: () => void;
};

function withinDragThreshold(positionX: number, positionY: number, clientX: number, clientY: number) {
  return Math.abs(positionX - clientX) < DRAG_THRESHOLD && Math.abs(positionY - clientY) < DRAG_THRESHOLD
}

export default function Person({ name, positionX, positionY, updatePosition, updateWidth, mode = "draggable", onClick, onOptions, onConnect }: PersonProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({x: 0, y: 0})
  const dragStartPoint = useRef({x: 200, y: 200})
  const justClosedOptionsBubble = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  // Note: this runs everytime the list of people in FamilyTree is re-ordered rather
  // than just when this Person component is initially mounted
  useLayoutEffect(() => {
    if (!ref.current) return
    console.log("layouteffect")
    updateWidth(ref.current.getBoundingClientRect().width)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  let colors;
  if (mode === "connectable") {
    colors = "bg-blue-400 hover:bg-blue-500 cursor-pointer";
  } else if (mode === "options") {
    colors = "bg-gray-300 cursor-default";
  } else if (mode === "draggable" && !isDragging) {
    colors = "bg-gray-500 hover:bg-gray-600 cursor-grab";
  } else if (mode === "draggable" && isDragging) {
    colors = "bg-gray-600 cursor-grabbing"
  } else{ // disabled
    colors = "bg-gray-300 cursor-default";
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button != 0) {
      return
    }
    if (mode === "draggable") {
      onClick() // In FamilyTree this moves the element to the front
      setIsDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
      dragOffset.current = {
        x: positionX - e.clientX,
        y: positionY - e.clientY
      }
      dragStartPoint.current = {
        x: e.clientX,
        y: e.clientY
      }
    } else if (mode === "options") {
      onOptions()
      justClosedOptionsBubble.current = true
    } else if (mode === "connectable" || mode === "disabled") {
      // onConnect()
    }
    e.stopPropagation()
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (e.button != 0) {
      return
    }
    if (mode !== "draggable") {
      return
    }
    if (justClosedOptionsBubble.current) {
      justClosedOptionsBubble.current = false
      return
    }
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (withinDragThreshold(dragStartPoint.current.x, dragStartPoint.current.y, e.clientX, e.clientY)) {
      onOptions()
    }
    e.stopPropagation()
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (isDragging && mode === "draggable") {
      e.currentTarget.setPointerCapture(e.pointerId)
      updatePosition(
        e.clientX + dragOffset.current.x,
        e.clientY + dragOffset.current.y
      )
      e.stopPropagation()
    }
  }

  return (
    <>
      {mode === "options" && <OptionsBubble positionX={positionX} positionY={positionY} onConnect={onConnect}/>}
      <div 
        className={`
          ${styles.person}
          ${colors}`}
        style={{
          transform: `translate(${positionX}px, ${positionY}px) translate(-50%, -50%)`,
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        ref={ref}
      >
        {name}
      </div>
    </>
  )
}

function OptionsBubble({ positionX, positionY, onConnect, onEdit, onPage }: OptionsBubbleProps) {
  return (
    <div 
      className={styles['options-bubble']}
      style={{
        "--x": `${positionX}px`,
        "--y": `${positionY}px`,
      } as React.CSSProperties}
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="grid grid-cols-2">
        <button 
          className="bg-amber-400 hover:cursor-pointer hover:bg-amber-500 text-4xl font-mono"
          onClick={onEdit}
        >
          Edit
        </button>
        <button 
          className="bg-blue-400 hover:cursor-pointer hover:bg-blue-500 text-4xl font-mono"
          onClick={onPage}
        >
          Page
        </button>
      </div>
      <button 
        className="bg-green-400 hover:cursor-pointer hover:bg-green-500 text-4xl font-mono"
        onClick={e => onConnect(e.clientX, e.clientY)}
      >
        Connect
      </button>
    </div>
  )
}
