'use client'

import { useState, useRef, useEffect, useLayoutEffect, MouseEvent } from "react"
import { PointerEvent } from "react"
import styles from "./Person.module.css"
import { PersonId, PersonMode, PersonSpatialData, Position } from "@/types/family-tree.types";
import { useEditorState, useEditorStateDispatch } from "../FamilyTree";
import { useCoordinates, useMousePosition } from "../Canvas/CanvasProvider";

const DRAG_THRESHOLD = 3; // 3px

type PressedState = "none" | "pressed" | "dragging"

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
  data: PersonSpatialData
  mode: PersonMode
  onMouseEnter: (id: PersonId) => void;
  onMouseLeave: (id: PersonId) => void
};

function withinDragThreshold(positionX: number, positionY: number, clientX: number, clientY: number) {
  return Math.abs(positionX - clientX) < DRAG_THRESHOLD && Math.abs(positionY - clientY) < DRAG_THRESHOLD
}

export function Person({ id, name, mode, data, onMouseEnter, onMouseLeave }: PersonProps) {
  const { mode: editorMode } = useEditorState()
  const dispatch = useEditorStateDispatch()
  const mousePosition = useMousePosition()
  const coordinates = useCoordinates()
  const [dragPosition, setDragPosition] = useState<Position | null>(null)
  const pressedState = useRef<PressedState>("none")
  const activePointerId = useRef<number | null>(null)
  const dragOffset = useRef({x: 0, y: 0})
  const dragStartPoint = useRef({x: 200, y: 200})
  const ref = useRef<HTMLDivElement>(null)

  const { position, width } = data
  const isDragging = dragPosition !== null
  const computedPosition = dragPosition ?? position

  // Note: this runs everytime the list of people in FamilyTree is re-ordered rather
  // than just when this Person component is initially mounted
  // useLayoutEffect(() => {
  //   if (!ref.current) return
  //   onWidthChange(id, ref.current.getBoundingClientRect().width)
  //   setWidth(ref.current.getBoundingClientRect().width)
  // }, [])

  useEffect(() => {
    if (editorMode.type === "viewing") {
      setDragPosition(null)
      pressedState.current = "none"
      if (activePointerId.current && ref.current?.hasPointerCapture(activePointerId.current)) {
        ref.current.releasePointerCapture(activePointerId.current)
        activePointerId.current = null
      }
    }
  }, [editorMode.type])

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
    if (mode === "draggable" && e.button === 0) {
      pressedState.current = "pressed"
      e.currentTarget.setPointerCapture(e.pointerId)
      activePointerId.current = e.pointerId
      dragOffset.current = {
        x: position.x - e.clientX,
        y: position.y - e.clientY
      }
      dragStartPoint.current = {
        x: e.clientX,
        y: e.clientY
      }
    } else if (mode === "draggable" && e.button === 2) {
      dispatch({
        type: "OPTIONS_OPENED",
        person: id
      })
    } else if (mode === "connectable" && e.button === 0) {
      dispatch({
        type: "BEGAN_CONNECTING_EXISTING_PERSON",
        person: id
      })
    }
    e.stopPropagation()
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (mode !== "draggable") {
      return
    }
    if (pressedState.current === "pressed") {
      dispatch({
        type: "BEGAN_ADDING_PERSON_FROM_PERSON",
        startPosition: coordinates.screenToWorld(mousePosition.get()),
        personId: id
      })
    } else if (pressedState.current === "dragging") {      
      setDragPosition(null)
      dispatch({
        type: "FINISHED_DRAGGING_PERSON",
        newPosition: {
          x: e.clientX + dragOffset.current.x,
          y: e.clientY + dragOffset.current.y
        },
        person: id
      })
    }
    pressedState.current = "none"
    activePointerId.current = null
    e.stopPropagation()
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (pressedState.current === "pressed") {
      if (!withinDragThreshold(dragStartPoint.current.x, dragStartPoint.current.y, e.clientX, e.clientY)) {
        pressedState.current = "dragging"
        setDragPosition(position)
        dispatch({
          type: "BEGAN_DRAGGING_PERSON",
          person: id
        })
      }
    } else if (pressedState.current === "dragging" && mode === "draggable") {
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

  function handleContextMenu(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  return (
    <>
      {isDragging && (
        <div 
          className={`
            ${styles.person}
            ${'bg-gray-800'}
          `}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`,
            width
          }}
        />
      )}
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
        onContextMenu={handleContextMenu}
        ref={ref}
      >
        {name}
      </div>
    </>
  )
}
