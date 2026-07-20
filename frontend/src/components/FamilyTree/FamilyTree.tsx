'use client'

import { useState, useRef, useEffect } from "react";
import { EditorAction, EditorMode, EditorState, PersonId } from "@/types/family-tree.types"
import { Relationships } from "@/components/Relationships";
import Overlay from "@/components/Overlay";
import Canvas from "@/components/Canvas";
import { Position } from "@/types/family-tree.types";
import { useImmerReducer } from "use-immer";
import familyTreeReducer from "./familyTreeReducer";
import People from "@/components/People";
import OptionsBubble from "@/components/OptionsBubble";
import Draft from "@/components/Draft";
import { useCoordinates } from "../Canvas/context";

const defaultState: EditorState = {
  graph: {
    peopleById: {},
    peopleIds: [],
    relationshipsById: {},
    relationshipIds: []
  },
  mode: { type: "dragging" }
}

export default function FamilyTree() {
  const [editorState, dispatch] = useImmerReducer<EditorState, EditorAction>(familyTreeReducer, defaultState)
  const mousePosition = useRef<Position>({ x: 0, y: 0 })
  const panPosition = useRef<Position>({ x: 0, y: 0 })
  
  const { peopleById } = editorState.graph
  const mode = editorState.mode

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (["connecting", "naming", "options"].includes(editorState.mode.type)) {
          dispatch({
            type: "CANCELED"
          })
        }
      } else if (e.key === "c") {
        if (["dragging", "options"].includes(editorState.mode.type)) {
          startAddingNewPerson()
        }
      } 
    }
    
    if (editorState.mode.type !== "disabled") {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editorState.mode])
  
  function handleConnect(personId: PersonId) {
    dispatch({
      type: "BEGAN_ADDING_PERSON_FROM_PERSON",
      personId,
      startPosition: {
        x: mousePosition.current.x - panPosition.current.x,
        y: mousePosition.current.y - panPosition.current.y
      }
    })
  }
  
  function startAddingNewPerson() {
    dispatch({
      type: "BEGAN_ADDING_PERSON",
      startPosition: {
        x: mousePosition.current.x - panPosition.current.x,
        y: mousePosition.current.y - panPosition.current.y
      }
    })
  }

  function handleUpdateMousePosition(position: Position) {
    mousePosition.current = position
  }

  function handleUpdatePanPosition(position: Position) {
    panPosition.current = position
  }

  function editorIsDrafting(mode: EditorMode): mode is Extract<EditorMode, { type: "choosing-connection" | "connecting" | "naming" }> {
    return mode.type === "choosing-connection" || mode.type === "naming" || mode.type === "connecting"
  }

  return (
    <>
      <Canvas
        disabled={false}
        onUpdateMousePosition={handleUpdateMousePosition}
        onUpdatePanPosition={handleUpdatePanPosition}
        overlay={(
          <Overlay 
            disabled={["connecting", "naming", "disabled"].includes(editorState.mode.type)}
            onAddPerson={startAddingNewPerson}
            helpText={editorState.mode.type}
          />
        )}
      >
        <Relationships 
          graph={editorState.graph}
          disabled={editorState.mode.type !== "dragging"}
          dispatch={dispatch}
        />
        {editorState.mode.type === "options" && (
          <OptionsBubble 
            person={peopleById[editorState.mode.personWithOptions]}
            onConnect={handleConnect}
            onEdit={() => {}}
            onPage={() => {}}
          />
        )}
        {editorIsDrafting(mode) && (
          <Draft
            graph={editorState.graph}
            mode={mode}
            dispatch={dispatch}
          />
        )}
        <People 
          editorState={editorState}
          dispatch={dispatch}
        />
      </Canvas>
    </>
  );
}
