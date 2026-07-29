import { EditorAction, EditorHistory, EditorState, FamilyGraph, RelationshipIndex } from "@/types/family-tree.types"
import { createContext, Dispatch, useContext, useMemo, useReducer } from "react"
import { historyReducer } from "./historyReducer"
import { getRelationshipIndex } from "./getRelationshipIndex"

const EditorStateContext = createContext<EditorState | null>(null)
const EditorStateDispatchContext = createContext<Dispatch<EditorAction> | null>(null)
const RelationshipIndexContext = createContext<RelationshipIndex | null>(null)

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

export function useRelationshipIndex() {
  const relationshipIndex = useContext(RelationshipIndexContext)
  if (relationshipIndex === null) {
    throw new Error("You can only use relationship index context inside editor state provider!")
  }
  return relationshipIndex
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
  const [editorHistory, dispatch] = useReducer<EditorHistory, [EditorAction]>(historyReducer, defaultState)

  const editorState = {
    graph: editorHistory.history[editorHistory.present],
    mode: editorHistory.mode
  }

  const relationshipIndex = useMemo(() => getRelationshipIndex(editorState.graph), [editorState.graph])

  return (
    <EditorStateContext value={editorState}>
      <EditorStateDispatchContext value={dispatch}>
        <RelationshipIndexContext value={relationshipIndex}>
          {children}
        </RelationshipIndexContext>
      </EditorStateDispatchContext>
    </EditorStateContext>
  )
}
