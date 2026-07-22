import { EditorAction, EditorHistory, EditorState } from "@/types/family-tree.types";
import editorReducer from "./editorReducer";
import { produce } from "immer";

function createNextHistory(state: EditorHistory, nextEditorState: EditorState): EditorHistory {
  return {
    history: [nextEditorState.graph, ...state.history.slice(state.present)],
    present: 0,
    mode: nextEditorState.mode
  }
}

export function historyReducer(state: EditorHistory, action: EditorAction): EditorHistory {
  // console.log("action", action)
  let snapshot: EditorState = {
    graph: state.history[state.present],
    mode: state.mode
  }
  const next: EditorState = produce(snapshot, draft => editorReducer(draft, action))
  switch (action.type) {
    case "FINISHED_DRAGGING_PERSON":
    case "CONNECTED_EXISTING_PERSON":
    case "NAMED_NEW_PERSON":
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
    case "UNDO":
      console.log(state)
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
    case "DEBUG": {
      console.log(state)
      return state
    }
    default:
      return {
        ...state,
        mode: next.mode
      }
  }
}