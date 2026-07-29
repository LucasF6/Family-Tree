'use client'

import { PersonId, PersonData, EditorState, EditorAction, Position, PersonMode, add, RelationshipId, Relationship, RelationshipIndex } from "@/types/family-tree.types"
import { Person } from "./Person"
import { useEffect, useRef } from "react"
import { useEditorState, useEditorStateDispatch } from "@/components/FamilyTree"
import { getUnconnectablePeople } from "./getConnectablePeople"
import { useRelationshipIndex } from "@/components/FamilyTree/EditorStateProvider"

function createModeById(mode: (id: PersonId) => PersonMode, ids: PersonId[]): Record<PersonId, PersonMode> {
  return Object.fromEntries(ids.map(id => [id, mode(id)]))
}

function createUniformModeById(mode: PersonMode, ids: PersonId[]): Record<PersonId, PersonMode> {
  return createModeById(() => mode, ids)
}


export default function People() {
  const editorState = useEditorState()
  const dispatch = useEditorStateDispatch()
  const hoveredPersonId = useRef<PersonId | null>(null)
  const lookup: RelationshipIndex = useRelationshipIndex()

  const { peopleIds: ids, peopleById: dataById } = editorState.graph
  const mode = editorState.mode


  let modeById: Record<PersonId, PersonMode>
  switch (mode.type) {
    case "viewing":
      modeById = createUniformModeById("draggable", ids)
      break
    case "dragging":
      modeById = createModeById(id => mode.personDragging === id ? "draggable" : "disabled", ids)
      break
    case "connecting":
      const unconnectablePeople: Set<PersonId> = getUnconnectablePeople(editorState.graph, mode.source, lookup)
      modeById = createModeById(id => unconnectablePeople.has(id) ? "disabled" : "connectable", ids)
      break
    default: 
      modeById = createUniformModeById("disabled", ids)
  }

  useEffect(() => {
    if (editorState.mode.type === "connecting") {
      hoveredPersonId.current = null
    }
  }, [editorState.mode.type])

  function hoverPerson(id: PersonId | null) {
    dispatch({
      type: "HOVERED_PERSON",
      person: id
    })
  }

  function handleMouseEnter(id: PersonId) {
    if (id !== hoveredPersonId.current) {
      hoveredPersonId.current = id
      hoverPerson(id)
    }
  }

  function handleMouseLeave(id: PersonId) {
    if (id === hoveredPersonId.current) {
      hoveredPersonId.current = null
      hoverPerson(null)
    }
  }

  return (
    <>
      {ids.map(id => {
        const person = dataById[id]
        return (
          <Person 
            key={id}
            id={id}
            name={person.name}
            mode={modeById[id]}
            data={person}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        )
      })}
    </>
  )
}
