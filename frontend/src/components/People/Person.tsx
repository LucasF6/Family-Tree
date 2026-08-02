'use client'

import { useState, useRef, useEffect, useLayoutEffect, MouseEvent } from "react"
import { PointerEvent } from "react"
import styles from "./Person.module.css"
import { PersonData, PersonId, PersonMode, PersonSpatialData, Position } from "@/types/family-tree.types";
import { useEditorState, useEditorStateDispatch } from "../FamilyTree";
import { useCoordinates, useMousePosition } from "../Canvas/CanvasProvider";
import { DragPreview } from "./DragPreview";

const DRAG_THRESHOLD = 3; // 3px

type PersonState = 
  | {
      type: "none"
    }
  | {
      type: "pressed"
      pressedPosition: Position
      offset: Position
      pointerId: number
    }
  | {
      type: "dragging"
      offset: Position
      pointerId: number
    }

type PersonProps = {
  name: string;
  id: PersonId
  data: PersonData
  mode: PersonMode
  onMouseEnter: (id: PersonId) => void;
  onMouseLeave: (id: PersonId) => void
};

function withinDragThreshold(positionX: number, positionY: number, clientX: number, clientY: number) {
  return Math.abs(positionX - clientX) < DRAG_THRESHOLD && Math.abs(positionY - clientY) < DRAG_THRESHOLD
}

export function Person({ mode, data, onMouseEnter, onMouseLeave }: PersonProps) {
  const { mode: editorMode } = useEditorState()
  const dispatch = useEditorStateDispatch()
  const coordinates = useCoordinates()

  const [previewDragPosition, setPreviewDragPosition] = useState<Position | null>(null)
  const state = useRef<PersonState>({ type: "none" })
  
  const cardRef = useRef<HTMLDivElement>(null)

  const { position } = data
  const isDragging = previewDragPosition !== null
  const computedPosition = previewDragPosition ?? position

  useEffect(() => {
    if (editorMode.type === "viewing") {
      if (state.current.type === "dragging" && cardRef.current?.hasPointerCapture(state.current.pointerId)) {
        cardRef.current.releasePointerCapture(state.current.pointerId)
      }
      setPreviewDragPosition(null)
      state.current = { type: "none" }
    }
  }, [editorMode.type])

  let colors;
  if (mode === "connectable") {
    colors = "bg-blue-400 hover:bg-blue-500 cursor-pointer";
  } else if (mode === "draggable" && !isDragging) {
    colors = "bg-gray-500 hover:bg-gray-600 cursor-grab";
  } else if (mode === "draggable" && isDragging) {
    colors = "bg-gray-600 cursor-grabbing"
  } else { // disabled
    colors = "bg-gray-300 cursor-default pointer-events-none";
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (mode === "draggable" && state.current.type === "none" && e.button === 0) {
      const mouseWorldPosition = coordinates.screenToWorld({
        x: e.clientX,
        y: e.clientY
      })
      state.current = {
        type: "pressed",
        pressedPosition: mouseWorldPosition,
        offset: {
          x: position.x - mouseWorldPosition.x,
          y: position.y - mouseWorldPosition.y
        },
        pointerId: e.pointerId
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    } else if (mode === "draggable" && state.current.type === "none" && e.button === 2) {
      dispatch({
        type: "OPTIONS_OPENED",
        person: data.id
      })
    } else if (mode === "connectable" && e.button === 0) {
      dispatch({
        type: "BEGAN_CONNECTING_EXISTING_PERSON",
        person: data.id
      })
    }
    e.stopPropagation()
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (mode !== "draggable") {
      return
    }
    if (state.current.type === "pressed") {
      dispatch({
        type: "BEGAN_ADDING_PERSON_FROM_PERSON",
        startPosition: coordinates.screenToWorld({
          x: e.clientX,
          y: e.clientY
        }),
        personId: data.id
      })
    } else if (state.current.type === "dragging") {      
      setPreviewDragPosition(null)
      const mouseWorldPosition = coordinates.screenToWorld({
        x: e.clientX,
        y: e.clientY
      })
      dispatch({
        type: "FINISHED_DRAGGING_PERSON",
        newPosition: {
          x: mouseWorldPosition.x + state.current.offset.x,
          y: mouseWorldPosition.y + state.current.offset.y
        },
        person: data.id
      })
    }
    state.current = { type: "none" }
    e.stopPropagation()
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const mouseWorldPosition = coordinates.screenToWorld({
      x: e.clientX,
      y: e.clientY
    })
    if (state.current.type === "pressed") {
      if (!withinDragThreshold(state.current.pressedPosition.x, state.current.pressedPosition.y, mouseWorldPosition.x, mouseWorldPosition.y)) {
        state.current = {
          ...state.current,
          type: "dragging",
        }
        setPreviewDragPosition(position)
        dispatch({
          type: "BEGAN_DRAGGING_PERSON",
          person: data.id
        })
      }
    } else if (state.current.type === "dragging" && mode === "draggable") {
      setPreviewDragPosition({
        x: mouseWorldPosition.x + state.current.offset.x,
        y: mouseWorldPosition.y + state.current.offset.y
      })
      e.stopPropagation()
    }
  }

  function handleMouseEnter() {
    if (mode === "connectable") {
      onMouseEnter(data.id)
    }
  }

  function handleMouseLeave() {
    if (mode === "connectable") {
      onMouseLeave(data.id)
    }
  }

  function handleLostPointerCapture(e: PointerEvent<HTMLDivElement>) {
    if (state.current.type === "none") {
      return
    } else if (state.current.type === "dragging") {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  return (
    <>
      {isDragging && <DragPreview personId={data.id} personData={data} previewPosition={previewDragPosition}/>}
      <div 
        className={`
          ${styles.person}
          ${colors}
        `}
        style={{
          transform: `translate(${computedPosition.x}px, ${computedPosition.y}px) translate(-50%, -50%)`,
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onLostPointerCapture={handleLostPointerCapture}
        ref={cardRef}
      >
        {data.imageURL && <img src={data.imageURL} className="w-15 h-15 rounded-full"/>}
        {data.name}
      </div>
    </>
  )
}
