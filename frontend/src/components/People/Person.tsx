'use client'

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { PointerEvent } from "react"
import styles from "./Person.module.css"
import { PersonId, PersonMode, Position } from "@/types/family-tree.types";

const DRAG_THRESHOLD = 3; // 3px

/**
 * draggable: the element can be dragged around the screen
 * 
 * connectable: a possible second person in a connection of two people
 * 
 * disabled: no functionality
 * 
 * options: options bubble is popped open
*/
type PersonProps = {
  name: string;
  id: PersonId
  position: Position
  mode: PersonMode
  onWidthChange: (id: PersonId, width: number) => void;
  onEndDrag: (id: PersonId, position: Position) => void;
  onStartDrag: (id: PersonId) => void;
  onOpenOptions: (id: PersonId) => void;
  onMouseEnter: (id: PersonId) => void;
  onMouseLeave: (id: PersonId) => void
  onConnect: (id: PersonId) => void;
};

function withinDragThreshold(positionX: number, positionY: number, clientX: number, clientY: number) {
  return Math.abs(positionX - clientX) < DRAG_THRESHOLD && Math.abs(positionY - clientY) < DRAG_THRESHOLD
}

export function Person({ id, name, mode, position, onWidthChange, onOpenOptions, onStartDrag, onEndDrag, onMouseEnter, onMouseLeave, onConnect }: PersonProps) {
  const [dragPosition, setDragPosition] = useState<Position>(position)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({x: 0, y: 0})
  const dragStartPoint = useRef({x: 200, y: 200})
  const ref = useRef<HTMLDivElement>(null)

  const computedPosition = isDragging ? dragPosition : position

  // Note: this runs everytime the list of people in FamilyTree is re-ordered rather
  // than just when this Person component is initially mounted
  useLayoutEffect(() => {
    if (!ref.current) return
    onWidthChange(id, ref.current.getBoundingClientRect().width)
  }, [])

  let colors;
  if (mode === "connectable") {
    colors = "bg-blue-400 hover:bg-blue-500 cursor-pointer";
  } else if (mode === "draggable" && !isDragging) {
    colors = "bg-gray-500 hover:bg-gray-600 cursor-grab";
  } else if (mode === "draggable" && isDragging) {
    colors = "bg-gray-600 cursor-grabbing"
  } else{ // disabled
    colors = "bg-gray-300 cursor-default";
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (mode === "draggable") {
      onStartDrag(id) // In FamilyTree this moves the element to the front
      setIsDragging(true)
      setDragPosition(position)
      e.currentTarget.setPointerCapture(e.pointerId)
      dragOffset.current = {
        x: dragPosition.x - e.clientX,
        y: dragPosition.y - e.clientY
      }
      dragStartPoint.current = {
        x: e.clientX,
        y: e.clientY
      }
    } else if (mode === "connectable") {

    }
    e.stopPropagation()
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (mode !== "draggable") {
      return
    }
    setIsDragging(false)
    if (withinDragThreshold(dragStartPoint.current.x, dragStartPoint.current.y, e.clientX, e.clientY)) {
      onOpenOptions(id)
    } else {      
      onEndDrag(id, {
        x: e.clientX + dragOffset.current.x,
        y: e.clientY + dragOffset.current.y
      })
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    e.stopPropagation()
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (isDragging && mode === "draggable") {
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragPosition({
        x: e.clientX + dragOffset.current.x,
        y: e.clientY + dragOffset.current.y
      })
      e.stopPropagation()
    }
  }

  function handleMouseEnter() {
    if (mode === "connectable") {
      onMouseEnter(id)
    }
  }

  function handleMouseLeave() {
    if (mode === "connectable") {
      onMouseLeave(id)
    }
  }

  return (
    <>
      <div 
        className={`
          ${styles.person}
          ${colors}`}
        style={{
          transform: `translate(${computedPosition.x}px, ${computedPosition.y}px) translate(-50%, -50%)`,
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={ref}
      >
        {name}
      </div>
    </>
  )
}
