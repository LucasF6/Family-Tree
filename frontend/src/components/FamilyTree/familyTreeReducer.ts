import { EditorState, EditorAction, Connection, PersonData, PersonId, RelationshipId, FamilyGraph } from "@/types/family-tree.types"
import { v4 } from "uuid"

function hasPersonAsSource(state: EditorState): state is { graph: FamilyGraph, mode: Extract<EditorState["mode"], { type: "naming", newConnection: Connection }>} {
  return state.mode.type === "naming" && state.mode.source.kind === "person"
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
      draft.mode.type = "dragging"
      break
    }
    case "DRAGGED_PERSON": {
      let index = draft.graph.peopleIds.indexOf(action.person)
      draft.graph.peopleIds = [
        ...draft.graph.peopleIds.slice(0, index),
        ...draft.graph.peopleIds.slice(index + 1),
        action.person
      ]
      break
    }
    case "BEGAN_ADDING_PERSON": {
      draft.mode = {
        type: "connecting",
        source: { kind: "none" },
        initialNewPersonPosition: action.mousePosition
      }
      break
    }
    case "BEGAN_ADDING_PERSON_FROM_PERSON": {
      draft.mode = {
        type: "connecting",
        source: { kind: "person", personId: action.personId },
        initialNewPersonPosition: action.mousePosition,
      }
      break
    }
    case "BEGAN_ADDING_PERSON_FROM_RELATIONSHIP": {
      draft.mode = {
        type: "connecting",
        source: { kind: "relationship", relationshipId: action.relationshipId },
        initialNewPersonPosition: action.mousePosition
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
          newConnection: "partner"
        }
      }
      break
    }
    case "UPDATED_PERSON_CONNECTION_TYPE": {
      if (hasPersonAsSource(draft)) {
        draft.mode.newConnection = action.newConnection
      }
      break
    }
    case "NAMED_NEW_PERSON": {
      if (action.name === "" || draft.mode.type !== "naming") {
        return
      }
      let newPerson: PersonData = {
        id: v4() as PersonId,
        name: action.name,
        x: draft.mode.newPersonPosition.x,
        y: draft.mode.newPersonPosition.y,
        width: 0,
      }
      draft.graph.peopleIds.push(newPerson.id)
      draft.graph.peopleById[newPerson.id] = newPerson
      if (hasPersonAsSource(draft)) {
        const id = v4() as RelationshipId
        draft.graph.relationshipIds.push(id)
        switch (draft.mode.newConnection) {
          case "parent":
            draft.graph.relationshipsById[id] = {
              parents: [newPerson.id],
              children: [draft.mode.source.personId],
            }
            break
          case "partner":
            draft.graph.relationshipsById[id] = {
              parents: [draft.mode.source.personId, newPerson.id],
              children: [],
            }
            break
          case "child":
            draft.graph.relationshipsById[id] = {
              parents: [draft.mode.source.personId],
              children: [newPerson.id],
            }
            break
        }
      } else if (draft.mode.source.kind === "relationship") {
        draft.graph.relationshipsById[
          draft.mode.source.relationshipId
        ].children.push(newPerson.id)
      }
      break
    }
  }
}
