import { EditorAction, EditorState } from "@/types/family-tree.types"
import { createContext, Dispatch, useContext } from "react"
import { useImmerReducer } from "use-immer"
import familyTreeReducer from "./familyTreeReducer"

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

const defaultState: EditorState = {
  graph: {
    peopleById: {},
    peopleIds: [],
    relationshipsById: {},
    relationshipIds: []
  },
  mode: { type: "viewing" }
}

export function EditorStateProvider({ children }: { children: React.ReactNode }) {
  const [editorState, dispatch] = useImmerReducer<EditorState, EditorAction>(familyTreeReducer, defaultState)

  return (
    <EditorStateContext value={editorState}>
      <EditorStateDispatchContext value={dispatch}>
        {children}
      </EditorStateDispatchContext>
    </EditorStateContext>
  )
}
