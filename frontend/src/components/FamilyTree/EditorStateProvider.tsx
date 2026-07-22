import { EditorAction, EditorHistory, EditorState, FamilyGraph } from "@/types/family-tree.types"
import { createContext, Dispatch, useContext, useReducer } from "react"
import { useImmerReducer } from "use-immer"
import familyTreeReducer from "./editorReducer"
import { historyReducer } from "./historyReducer"

export const EditorStateContext = createContext<EditorState | null>(null)
export const EditorStateDispatchContext = createContext<Dispatch<EditorAction> | null>(null)

export function useEditorState() {
  const editorState = useContext(EditorStateContext)
  if (editorState === null) {
    throw new Error("You can only use editor state context in a editor state provider!")
  }
  return editorState
}

export function useEditorStateDispatch() {
  const dispatch = useContext(EditorStateDispatchContext)
  if (dispatch === null) {
    throw new Error("You can only use editor state dispatch context in editor state provider!")
  }
  return dispatch
}

const defaultState: EditorHistory = {
  history: [
    {
      peopleById: {},
      peopleIds: [],
      relationshipsById: {},
      relationshipIds: []
    }
  ],
  present: 0,
  mode: { type: "viewing" }
}

export function EditorStateProvider({ children }: { children: React.ReactNode }) {
  // const [editorState, dispatch] = useImmerReducer<EditorState, EditorAction>(familyTreeReducer, defaultState)
  const [editorHistory, dispatch] = useReducer<EditorHistory, [EditorAction]>(historyReducer, defaultState)

  const editorState = {
    graph: editorHistory.history[editorHistory.present],
    mode: editorHistory.mode
  }

  return (
    <EditorStateContext value={editorState}>
      <EditorStateDispatchContext value={dispatch}>
        {children}
      </EditorStateDispatchContext>
    </EditorStateContext>
  )
}
