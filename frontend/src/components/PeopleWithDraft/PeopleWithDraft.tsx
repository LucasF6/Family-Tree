'use client'

import Draft from "@/components/Draft";
import { useEditorState, useEditorStateDispatch } from "@/components/FamilyTree";
import People from "@/components/People";
import { EditorMode } from "@/types/family-tree.types";

export function PeopleWithDraft() {
  const { mode, graph } = useEditorState()
  const dispatch = useEditorStateDispatch()

  function inDraftMode(mode: EditorMode): mode is Extract<EditorMode, { type: "connecting" | "choosing-connection" | "naming" }> {
    return ["connecting", "choosing-connection", "naming"].includes(mode.type)
  }

  return (
    <>
      {inDraftMode(mode) && (
        <Draft
          mode={mode}
          graph={graph}
          dispatch={dispatch}
        />
      )}
      <People />
    </>
  )
}