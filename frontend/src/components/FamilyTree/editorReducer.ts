import { EditorState, EditorAction, Connection, PersonData, PersonId, RelationshipId, FamilyGraph, EditorMode, Relationship } from "@/types/family-tree.types"
import { v4 } from "uuid"
import { getConnections } from "../Draft/getConnections"
import { getRelationshipIndex } from "./getRelationshipIndex"

const padding  = 20
let canvas: HTMLCanvasElement
let context: CanvasRenderingContext2D
function getTextWidth(text: string, font: string): number {
  canvas = canvas ?? document.createElement("canvas")
  context = context ?? canvas.getContext("2d")!
  context.font = font
  return context.measureText(text).width + padding * 2;
}

function createRelationship(draft: EditorState, callback: (id: RelationshipId) => Relationship): RelationshipId {
  const id: RelationshipId = v4() as RelationshipId
  draft.graph.relationshipsById[id] = callback(id)
  draft.graph.relationshipIds.push(id)
  return id
}

function createDirectRelationship(draft: EditorState, connection: Connection, from: PersonId, to: PersonId): RelationshipId {
  const id: RelationshipId = v4() as RelationshipId
  return createRelationship(draft, id => {
    switch (connection) {
      case "parent":
        return {
          id,
          parents: [to],
          children: [from],
        }
      case "partner":
        return {
          id,
          parents: [from, to],
          children: [],
        }
      case "child":
        return {
          id,
          parents: [from],
          children: [to],
        }
    }
  })
}

function createParentChildRelationship(draft: EditorState, connection: "parent" | "child", from: PersonId, to: PersonId) {
  const { relationshipIds, relationshipsById } = draft.graph
  let child, parent: PersonId
  if (connection === "parent") {
    child = from
    parent = to
  } else {
    child = to
    parent = from
  }
  // Relationship with the child as a child if it exists
  const childRelId: RelationshipId | undefined = relationshipIds.find(id => relationshipsById[id].children.includes(child))
  if (childRelId) {
    const childRel: Relationship = relationshipsById[childRelId]
    if (childRel.parents.length === 2) {
      throw new Error("Cannot create person with more than two parents")
    }
    const initialParent: PersonId = childRel.parents[0]
    let relId: RelationshipId | undefined
    if (relId = relationshipIds.find(id => {
      const relationship = relationshipsById[id]
      return relationship.parents.includes(initialParent) && relationship.parents.includes(parent)
    })) {
      relationshipsById[relId].children.push(child)
    } else {
      createRelationship(draft, id => ({
        id,
        parents: [initialParent, parent],
        children: [child]
      }))
    }
    draft.graph.relationshipIds = relationshipIds.filter(id => id !== childRelId)
    delete draft.graph.relationshipsById[childRelId]
  } else {
    createDirectRelationship(draft, "parent", child, parent)
  }
}

export default function editorReducer(draft: EditorState, action: EditorAction): undefined {
  switch (action.type) {
    case "OPTIONS_OPENED": {
      draft.mode = {
        type: "options",
        personWithOptions: action.person
      }
      break
    }
    case "CANCELED": {
      draft.mode.type = "viewing"
      break
    }
    case "BEGAN_DRAGGING_PERSON": {
      let index = draft.graph.peopleIds.indexOf(action.person)
      draft.graph.peopleIds = [
        ...draft.graph.peopleIds.slice(0, index),
        ...draft.graph.peopleIds.slice(index + 1),
        action.person
      ]
      draft.mode = {
        type: "dragging",
        personDragging: action.person
      }
      break
    }
    case "FINISHED_DRAGGING_PERSON": {
      if (draft.mode.type !== "dragging") {
        throw new Error("Editor must be in dragging mode!")
      }
      draft.graph.peopleById[draft.mode.personDragging].position = action.newPosition
      draft.mode = { type: "viewing" }
      break
    }
    case "BEGAN_ADDING_PERSON": {
      draft.mode = {
        type: "connecting",
        source: { kind: "none" },
        newPersonPosition: action.startPosition,
        focusedPerson: null
      }
      break
    }
    case "BEGAN_ADDING_PERSON_FROM_PERSON": {
      draft.mode = {
        type: "connecting",
        source: { kind: "person", personId: action.personId },
        newPersonPosition: action.startPosition,
        focusedPerson: null
      }
      break
    }
    case "BEGAN_ADDING_PERSON_FROM_RELATIONSHIP": {
      draft.mode = {
        type: "connecting",
        source: { kind: "relationship", relationshipId: action.relationshipId },
        newPersonPosition: action.startPosition,
        focusedPerson: null,
      }
      break
    }
    case "CHOSE_NEW_PERSON_LOCATION": {
      if (draft.mode.type !== "connecting") {
        throw new Error("editor must be in connecting mode!")
      }
      draft.mode = {
        type: "naming",
        source: draft.mode.source,
        newPersonPosition: action.position
      }
      break
    }
    case "NAMED_NEW_PERSON": {
      if (action.name === "" || draft.mode.type !== "naming" || (action.fromPerson !== (draft.mode.source.kind === "person"))) {
        throw new Error("name of new person cannot be empty and editor must be in naming mode!")
      }
      let newPerson: PersonData = {
        id: v4() as PersonId,
        name: action.name,
        position: draft.mode.newPersonPosition,
        width: action.width,
      }
      draft.graph.peopleIds.push(newPerson.id)
      draft.graph.peopleById[newPerson.id] = newPerson
      const source = draft.mode.source
      if (source.kind === "person" && action.fromPerson) {
        const relationshipIdWithParents: undefined | RelationshipId = draft.graph.relationshipIds.find(relId => draft.graph.relationshipsById[relId].children.find(id => source.personId === id))
        if (relationshipIdWithParents && action.connection === "parent" && draft.graph.relationshipsById[relationshipIdWithParents].parents.length === 1) {
          createRelationship(draft, id => ({
            id,
            parents: [newPerson.id, draft.graph.relationshipsById[relationshipIdWithParents].parents[0]],
            children: [source.personId]
          }))
          draft.graph.relationshipIds = draft.graph.relationshipIds.filter(relId => relId !== relationshipIdWithParents)
          delete draft.graph.relationshipsById[relationshipIdWithParents]
        } else {
          createDirectRelationship(draft, action.connection, source.personId, newPerson.id)
        }
      } else if (source.kind === "relationship" && !action.fromPerson) {
        const relationship: Relationship = draft.graph.relationshipsById[source.relationshipId]
        if (relationship.parents.length === 1) {
          createDirectRelationship(draft, "child", relationship.parents[0], newPerson.id)
        } else {
          relationship.children.push(newPerson.id)
        }
      }
      draft.mode = { type: "viewing" }
      break
    }
    case "BEGAN_CONNECTING_EXISTING_PERSON": {
      if (draft.mode.type !== "connecting") {
        throw new Error("Can only begin connecting an existing person in connecting mode!")
      }
      const source = draft.mode.source
      if (source.kind === "none") {
        throw new Error("When connecting an existing person, there must be a source person!")
      }
      if (source.kind === "relationship") {
        const relationship: Relationship = draft.graph.relationshipsById[source.relationshipId]
        if (relationship.parents.length === 1) {
          createDirectRelationship(draft, "child", relationship.parents[0], action.person)
        } else {
          relationship.children.push(action.person)
        }
        draft.mode = { type: "viewing" }
      } else {
        const from: PersonId = source.personId
        const to: PersonId = action.person
        const index = getRelationshipIndex(draft.graph)
        const connections: Connection[] = getConnections(from, to, index)

        if (connections.length === 1) {
          const connection = connections[0]
          if (
            connection === "partner"
          ) {
            createDirectRelationship(draft, connection, from, to)
          } else {
            createParentChildRelationship(draft, connection, from, to)
          }
          draft.mode = {type: "viewing"}
        } else {
          draft.mode = {
            type: "choosing-connection",
            source,
            person: action.person
          }
        }
      }
      break
    }
    case "CONNECTED_EXISTING_PERSON": {
      if (draft.mode.type !== "choosing-connection") {
        throw new Error("can only choose connection in choosing-connection mode!")
      }
      const from: PersonId = draft.mode.source.personId
      const to: PersonId = draft.mode.person

      if (action.connection === "partner") {
        createDirectRelationship(draft, "partner", from, to)
      } else {
        createParentChildRelationship(draft, action.connection, from, to)
      }
      draft.mode = { type: "viewing" }
      break
    }
    case "HOVERED_PERSON":
      if (draft.mode.type !== "connecting") {
        throw new Error("Can only update focused person in connecting mode!")
      }
      draft.mode.focusedPerson = action.person
      break
    case "CHANGED_RELATIONSHIP_STRENGTH":
      draft.graph.relationshipsById[action.relationshipId].strength = action.strength
      break
    case "OPENED_PERSON_SETTINGS":
      draft.mode = {
        type: "person-settings",
        person: action.personId
      }
      break
    case "EDITED_PERSON":
      if (draft.mode.type !== "person-settings") {
        throw new Error("Must be in person settings mode to edit person!")
      }
      const person = draft.graph.peopleById[draft.mode.person]
      if (action.image) {
        person.imageURL = action.image.url
        person.imageFile = action.image.file
      }
      if (action.name) {
        person.name = action.name
        const textWidth = getTextWidth(action.name, "16px Arial")
        person.width = person.imageURL ? textWidth + 60 : textWidth
      }
      draft.mode = { type: "viewing" }
      break
    case "DELETED_PERSON": {
      draft.graph.relationshipIds = draft.graph.relationshipIds.filter(relId => {
        const { children, parents } = draft.graph.relationshipsById[relId]

        if (children.includes(action.personId)) {
          if (parents.length === 1) {
            delete draft.graph.relationshipsById[relId]
            return false
          }
          draft.graph.relationshipsById[relId].children = children.filter(childId => childId !== action.personId)
          return true
        } else if (parents.includes(action.personId)) {
          delete draft.graph.relationshipsById[relId]
          return false
        } else {
          return true
        }
      })
      draft.graph.peopleIds = draft.graph.peopleIds.filter(id => id !== action.personId)
      delete draft.graph.peopleById[action.personId]
      draft.mode = { type: "viewing" }
      break
    }
  }
}
