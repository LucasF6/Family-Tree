'use client'

import { PersonId, PersonData, EditorState, EditorAction, Position, PersonMode, add, RelationshipId, Relationship, RelationshipIndex } from "@/types/family-tree.types"
import { Person } from "./Person"
import { useEffect, useRef } from "react"
import { useEditorState, useEditorStateDispatch } from "../FamilyTree"
import { getUnconnectablePeople } from "./getConnectablePeople"
import { getRelationshipIndex } from "./getRelationshipIndex"

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

  const { peopleIds: ids, peopleById: dataById, relationshipIds, relationshipsById } = editorState.graph
  const mode = editorState.mode

  const lookup: RelationshipIndex = getRelationshipIndex(editorState.graph)

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

      // switch (mode.source.kind) {
      //   case "none":
      //     modeById = createUniformModeById("disabled", ids)
      //     break
      //   case "relationship":
      //     const sourceId = mode.source.relationshipId
      //     const sourceRelationship: Relationship = relationshipsById[sourceId]
      //     const impossibleNewChildren: Set<PersonId> = new Set()
      //     relationshipIds.forEach(id => {
      //       const relationship: Relationship = relationshipsById[id]
      //       if (sourceRelationship.parents.length === 2 || relationship.parents.length === 2 || relationship.parents[0] === sourceRelationship.parents[0]) {
      //         relationship.children.forEach(child => impossibleNewChildren.add(child))
      //       }
      //     })
      //     modeById = createModeById(id => (sourceRelationship.parents.includes(id) || impossibleNewChildren.has(id)) ? "disabled" : "connectable", ids)
      //     break
      //   case "person":
      //     const fromId = mode.source.personId
      //     const people: Record<PersonId, { isPartner: boolean, isParent: boolean, isChild: boolean }> =
      //       Object.fromEntries(ids.map(id => [id, { isPartner: false, isParent: false, isChild: false }]))
      //     let hasTwoParents: boolean = false
      //     relationshipIds.forEach(id => {
      //       const relationship: Relationship = relationshipsById[id]
      //       if (relationship.parents.includes(fromId)) {
      //         relationship.children.forEach(id => people[id].isChild = true)
      //       if (relationship.parents.length === 2) {
      //           const partnerId = relationship.parents[0] === fromId ? relationship.parents[1] : relationship.parents[0]
      //           people[partnerId].isPartner = true 
      //         }
      //       }
      //       if (relationship.children.includes(fromId)) {
      //         relationship.parents.forEach(id => people[id].isParent = true)
      //         if (relationship.parents.length === 2) {
      //           hasTwoParents = true
      //         }
      //       }
      //     })
      //     modeById = createModeById(id => {
      //       if (id === fromId) {
      //         return "disabled"
      //       }
      //       const person = people[id]
      //       if (hasTwoParents) {
      //         return person.isPartner && person.isParent ? "disabled" : "connectable"
      //       } else {
      //         return person.isPartner && (person.isChild || person.isParent) ? "disabled" : "connectable"
      //       }
      //     }, ids)
      //     break
      // }
      // break
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
