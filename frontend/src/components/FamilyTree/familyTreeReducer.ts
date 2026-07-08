import { EditorState, EditorAction, Connection, PersonData, PersonId, RelationshipId } from "@/types/family-tree.types"
import { v4 } from "uuid"

function hasPersonAsSource(state: EditorState): state is Extract<EditorState, { mode: "naming", newConnection: Connection }> {
  return state.mode === "naming" && state.source.kind === "person"
}

export default function familyTreeReducer(draft: EditorState, action: EditorAction): EditorState | undefined {
  switch (action.type) {
    case "OPTIONS_OPENED": {
      return {
        ...draft,
        mode: "options",
        personWithOptions: action.person
      }
    }
    case "CANCELED": {
      draft.mode = "dragging"
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
      return {
        ...draft,
        mode: "connecting",
        source: { kind: "none" },
        initialNewPersonPosition: action.mousePosition
      }
    }
    case "BEGAN_ADDING_PERSON_FROM_PERSON": {
      return {
        ...draft,
        mode: "connecting",
        source: { kind: "person", personId: action.personId },
        initialNewPersonPosition: action.mousePosition
      }
    }
    case "BEGAN_ADDING_PERSON_FROM_RELATIONSHIP": {
      return {
        ...draft,
        mode: "connecting",
        source: { kind: "relationship", relationshipId: action.relationshipId },
        initialNewPersonPosition: action.mousePosition
      }
    }
    case "CHOSE_NEW_PERSON_LOCATION": {
      if (draft.mode !== "connecting") {
        return
      }
      if (draft.source.kind !== "person") {
        return {
          ...draft,
          mode: "naming",
          source: draft.source,
          newPersonPosition: action.position
        }
      }
      return {
        ...draft,
        mode: "naming",
        source: draft.source,
        newPersonPosition: action.position,
        newConnection: "partner"
      }
    }
    case "UPDATED_PERSON_CONNECTION_TYPE": {
      if (hasPersonAsSource(draft)) {
        draft.newConnection = action.newConnection
      }
      break
    }
    case "NAMED_NEW_PERSON": {
      if (action.name === "" || draft.mode !== "naming") {
        return
      }
      let newPerson: PersonData = {
        id: v4() as PersonId,
        name: action.name,
        x: draft.newPersonPosition.x,
        y: draft.newPersonPosition.y,
        width: 0,
      }
      draft.graph.peopleIds.push(newPerson.id)
      draft.graph.peopleById[newPerson.id] = newPerson
      if (hasPersonAsSource(draft)) {
        const id = v4() as RelationshipId
        draft.graph.relationshipIds.push(id)
        switch (draft.newConnection) {
          case "parent":
            draft.graph.relationshipsById[id] = {
              parents: [newPerson.id],
              children: [draft.source.personId],
            }
            break
          case "partner":
            draft.graph.relationshipsById[id] = {
              parents: [draft.source.personId, newPerson.id],
              children: [],
            }
            break
          case "child":
            draft.graph.relationshipsById[id] = {
              parents: [draft.source.personId],
              children: [newPerson.id],
            }
            break
        }
      } else if (draft.source.kind === "relationship") {
        draft.graph.relationshipsById[
          draft.source.relationshipId
        ].children.push(newPerson.id)
      }
      break
    }
  }
}
