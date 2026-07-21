import { PersonId, PersonData, EditorState, EditorAction, Position, PersonMode, add, RelationshipId, Relationship } from "@/types/family-tree.types"
import { Person } from "./Person"
import { useEffect, useRef } from "react"
import { useEditorState, useEditorStateDispatch } from "../FamilyTree"
import Draft from "../Draft"

function createModeById(mode: (id: PersonId) => PersonMode, ids: PersonId[]): Record<PersonId, PersonMode> {
  return Object.fromEntries(ids.map(id => [id, mode(id)]))
}

function createUniformModeById(mode: PersonMode, ids: PersonId[]): Record<PersonId, PersonMode> {
  return createModeById(() => mode, ids)
}


export default function People() {
  const editorState = useEditorState()
  const dispatch = useEditorStateDispatch()
  const focusedPersonId = useRef<PersonId | null>(null)

  const { peopleIds: ids, peopleById: dataById, relationshipIds, relationshipsById } = editorState.graph
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
      switch (mode.source.kind) {
        case "none":
          modeById = createUniformModeById("disabled", ids)
          break
        case "relationship":
          const relationship: Relationship = relationshipsById[mode.source.relationshipId]
          modeById = createModeById(id => (relationship.parents.includes(id) || relationship.children.includes(id)) ? "disabled" : "connectable", ids)
          break
        case "person":
          const fromId = mode.source.personId
          const people: Record<PersonId, { isPartner: boolean, isParent: boolean, isChild: boolean }> =
            Object.fromEntries(ids.map(id => [id, { isPartner: false, isParent: false, isChild: false }]))
          let hasTwoParents: boolean = false
          relationshipIds.forEach(id => {
            const relationship: Relationship = relationshipsById[id]
            if (relationship.parents.includes(fromId)) {
              relationship.children.forEach(id => people[id].isChild = true)
              if (relationship.parents.length === 2) {
                const partnerId = relationship.parents[0] === fromId ? relationship.parents[1] : relationship.parents[0]
                people[partnerId].isPartner = true 
              }
            }
            if (relationship.children.includes(fromId)) {
              relationship.parents.forEach(id => people[id].isParent = true)
              if (relationship.parents.length === 2) {
                hasTwoParents = true
              }
            }
          })
          modeById = createModeById(id => {
            if (id === fromId) {
              return "disabled"
            }
            const person = people[id]
            if (hasTwoParents) {
              return person.isPartner && person.isChild ? "disabled" : "connectable"
            } else {
              return person.isPartner && (person.isChild || person.isParent) ? "disabled" : "connectable"
            }
          }, ids)
          break
      }
      break
    default: 
      modeById = createUniformModeById("disabled", ids)
  }

  useEffect(() => {
    if (editorState.mode.type === "connecting") {
      focusedPersonId.current = null
    }
  }, [editorState.mode.type])

  function handleWidthChange(id: PersonId, width: number) {
    dispatch({
      type: "CHANGED_PERSON_WIDTH",
      person: id,
      newWidth: width
    })
  }

  function handleOpenOptions(id: PersonId) {
    dispatch({
      type: "OPTIONS_OPENED",
      person: id
    })
  }

  function handleStartDrag(id: PersonId) {
    dispatch({
      type: "BEGAN_DRAGGING_PERSON",
      person: id
    })
  }

  function handleEndDrag(id: PersonId, newPosition: Position) {
    dispatch({
      type: "FINISHED_DRAGGING_PERSON",
      person: id,
      newPosition
    })
  }

  function updateFocusedPerson(id: PersonId | null) {
    dispatch({
      type: "UPDATED_FOCUSED_PERSON",
      person: id
    })
  }

  function handleMouseEnter(id: PersonId) {
    if (id !== focusedPersonId.current) {
      focusedPersonId.current = id
      updateFocusedPerson(id)
    }
  }

  function handleMouseLeave(id: PersonId) {
    if (id === focusedPersonId.current) {
      focusedPersonId.current = null
      updateFocusedPerson(null)
    }
  }

  function handleConnect(id: PersonId) {
    dispatch({
      type: "BEGAN_CONNECTING_EXISTING_PERSON",
      person: id
    })
  }

  return (
    <>
      {(mode.type === "connecting" || mode.type === "choosing-connection" || mode.type === "naming") && (
        <Draft mode={mode} graph={editorState.graph} dispatch={dispatch} />
      )}
      {ids.map(id => {
        const person = dataById[id]
        return (
          <Person 
            key={id}
            id={id}
            name={person.name}
            mode={modeById[id]}
            position={person.position}
            onWidthChange={handleWidthChange}
            onOpenOptions={handleOpenOptions}
            onStartDrag={handleStartDrag}
            onEndDrag={handleEndDrag}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onConnect={handleConnect}
          />
        )
      })}
    </>
  )
}
