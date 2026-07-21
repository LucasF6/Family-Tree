import { EditorState, EditorAction, Connection, PersonData, PersonId, RelationshipId, FamilyGraph, EditorMode } from "@/types/family-tree.types"
import { v4 } from "uuid"

function createRelationship(draft: EditorState, connection: Connection, relationshipId: RelationshipId, connectingId: PersonId, newId: PersonId) {
  switch (connection) {
    case "parent":
      draft.graph.relationshipsById[relationshipId] = {
        id: relationshipId,
        parents: [newId],
        children: [connectingId],
      }
      break
    case "partner":
      draft.graph.relationshipsById[relationshipId] = {
        id: relationshipId,
        parents: [connectingId, newId],
        children: [],
      }
      break
    case "child":
      draft.graph.relationshipsById[relationshipId] = {
        id: relationshipId,
        parents: [connectingId],
        children: [newId],
      }
      break
  }
  draft.graph.relationshipIds.push(relationshipId)
}

export default function familyTreeReducer(draft: EditorState, action: EditorAction): EditorState | undefined {
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
        return
      }
      draft.graph.peopleById[draft.mode.personDragging].position = action.newPosition
      draft.mode = { type: "viewing" }
      break
    }
    case "CHANGED_PERSON_WIDTH": {
      draft.graph.peopleById[action.person].width = action.newWidth
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
        return
      }
      if (draft.mode.source.kind !== "person") {
        draft.mode = {
          type: "naming",
          source: draft.mode.source,
          newPersonPosition: action.position
        }
      } else {
        draft.mode = {
          type: "naming",
          source: draft.mode.source,
          newPersonPosition: action.position,
        }
      }
      break
    }
    case "NAMED_NEW_PERSON": {
      if (action.name === "" || draft.mode.type !== "naming" || (action.fromPerson !== (draft.mode.source.kind === "person"))) {
        return
      }
      let newPerson: PersonData = {
        id: v4() as PersonId,
        name: action.name,
        position: draft.mode.newPersonPosition,
        width: 0,
      }
      draft.graph.peopleIds.push(newPerson.id)
      draft.graph.peopleById[newPerson.id] = newPerson
      const source = draft.mode.source
      if (source.kind === "person" && action.fromPerson) {
        const id: RelationshipId = v4() as RelationshipId
        const relationshipIdWithParents: undefined | RelationshipId = draft.graph.relationshipIds.find(relId => draft.graph.relationshipsById[relId].children.find(id => source.personId === id))
        if (relationshipIdWithParents && action.connection === "parent" && draft.graph.relationshipsById[relationshipIdWithParents].parents.length === 1) {
          draft.graph.relationshipIds.push(id)
          draft.graph.relationshipsById[id] = {
            id,
            parents: [newPerson.id, draft.graph.relationshipsById[relationshipIdWithParents].parents[0]],
            children: [source.personId]
          }
          draft.graph.relationshipIds = draft.graph.relationshipIds.filter(relId => relId !== relationshipIdWithParents)
          delete draft.graph.relationshipsById[relationshipIdWithParents]
        } else {
          createRelationship(draft, action.connection, id, source.personId, newPerson.id)
        }
        
      } else if (source.kind === "relationship" && !action.fromPerson) {
        draft.graph.relationshipsById[
          source.relationshipId
        ].children.push(newPerson.id)
      }
      draft.mode = { type: "viewing" }
      break
    }
    case "BEGAN_CONNECTING_EXISTING_PERSON": {
      if (draft.mode.type !== "connecting") {
        return
      }
      const source = draft.mode.source
      if (source.kind === "none") {
        return
      }
      if (source.kind === "relationship") {
        draft.graph.relationshipsById[source.relationshipId].children.push(action.person)
        draft.mode = { type: "viewing" }
      } else {
        let isParent: boolean = false
        let isPartner: boolean = false
        let isChild: boolean = false
        let hasTwoParents: boolean = false
        draft.graph.relationshipIds.forEach(id => {
          const { parents, children } = draft.graph.relationshipsById[id]
          if (parents.includes(source.personId) && parents.includes(action.person)) {
            isPartner = true
          }
          if (parents.includes(source.personId) && children.includes(action.person)) {
            isChild = true
          }
          if (children.includes(source.personId) && parents.includes(action.person)) {
            isParent = true
          }
          if (children.includes(source.personId) && parents.length === 2) {
            hasTwoParents = true
          }
        })
        if (isParent || isChild) {
          // forces action.person to be the partner of source.personId
          const id: RelationshipId = v4() as RelationshipId
          createRelationship(draft, "partner", id, source.personId, action.person)
          draft.mode = { type: "viewing" }
        } else if (isPartner && hasTwoParents) {
          // forces action.person to be the child of source.personId and an unspecified person
          const id: RelationshipId = v4() as RelationshipId
          createRelationship(draft, "child", id, source.personId, action.person)
          draft.mode = { type: "viewing" }
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
        return
      }
      const id: RelationshipId = v4() as RelationshipId
      createRelationship(draft, action.connection, id, draft.mode.source.personId, draft.mode.person)
      draft.mode = { type: "viewing" }
      break
    }
    case "UPDATED_FOCUSED_PERSON":
      if (draft.mode.type !== "connecting") {
        return
      }
      draft.mode.focusedPerson = action.person
      break
  }
}
