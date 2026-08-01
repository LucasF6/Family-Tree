import { EditorAction, EditorHistory, EditorState } from "@/types/family-tree.types";
import editorReducer from "./editorReducer";
import { produce } from "immer";

/** Deletes future snapshots if present and adds a new snapshot */
function createNextHistory(state: EditorHistory, nextEditorState: EditorState): EditorHistory {
  return {
    history: [nextEditorState.graph, ...state.history.slice(state.present)],
    present: 0,
    mode: nextEditorState.mode
  }
}

/** Modifies graph without creating new snapshot or deleting future snapshots */
function updateState(state: EditorHistory, nextEditorState: EditorState): EditorHistory {
  return {
    history: [...state.history.slice(0, state.present), nextEditorState.graph, ...state.history.slice(state.present + 1)],
    present: state.present,
    mode: nextEditorState.mode
  }
}

export function historyReducer(state: EditorHistory, action: EditorAction): EditorHistory {
  let snapshot: EditorState = {
    graph: state.history[state.present],
    mode: state.mode
  }
  console.log(action.type)
  const next: EditorState = produce(snapshot, draft => editorReducer(draft, action))
  switch (action.type) {
    case "FINISHED_DRAGGING_PERSON":
    case "CONNECTED_EXISTING_PERSON":
    case "NAMED_NEW_PERSON":
    case "CHANGED_RELATIONSHIP_STRENGTH":
    case "DELETED_PERSON":
    case "EDITED_PERSON":
      return createNextHistory(state, next)
    case "BEGAN_CONNECTING_EXISTING_PERSON":
      if (next.mode.type !== "choosing-connection") {
        return createNextHistory(state, next)
      } else {
        return {
          ...state,
          mode: next.mode
        }
      }
    case "BEGAN_DRAGGING_PERSON":
      return updateState(state, next)
    case "UNDO":
      return {
        history: state.history,
        present: state.present < state.history.length - 1 ? state.present + 1 : state.present,
        mode: { type: "viewing" }
      }
    case "REDO":
      return {
        history: state.history,
        present: state.present > 0 ? state.present - 1 : state.present,
        mode: { type: "viewing" }
      }
    default:
      return {
        ...state,
        mode: next.mode
      }
  }
}