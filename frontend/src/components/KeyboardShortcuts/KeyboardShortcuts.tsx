import { useEditorState, useEditorStateDispatch } from "@/components/FamilyTree"
import { useEffect } from "react"
import { useCoordinates, useMousePosition } from "../Canvas/CanvasProvider"

export default function KeyboardShortcuts() {
  const editorState = useEditorState()
  const dispatch = useEditorStateDispatch()
  const mousePosition = useMousePosition()
  const coordinates = useCoordinates()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (["dragging", "connecting", "naming", "options", "choosing-connection"].includes(editorState.mode.type)) {
          dispatch({
            type: "CANCELED"
          })
        }
      } else if (e.key.toLowerCase() === 'c') {
        if (["viewing", "options"].includes(editorState.mode.type)) {
          dispatch({
            type: "BEGAN_ADDING_PERSON",
            startPosition: coordinates.screenToWorld(mousePosition.get())
          })
          console.log(coordinates.screenToWorld(mousePosition.get()))
        }
      } else if (e.key.toLowerCase() === 'z' && e.ctrlKey) {
        console.log("control z")
      } else if (e.key.toLowerCase() === 'y' && e.ctrlKey) {
        console.log("ctrl y")
      }
    }

    if (editorState.mode.type !== "disabled") {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editorState.mode])

  return <></>
}