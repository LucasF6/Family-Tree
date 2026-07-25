import { useCoordinates, useMousePosition } from "../Canvas/CanvasProvider";
import { useEditorState, useEditorStateDispatch } from "../FamilyTree";
import { validate } from "../FamilyTree/validate";
import { AddPersonButton } from "./AddPersonButton";
import { FamilyTreeMode } from "@/types/family-tree.types"

const helpTextByMode: Record<string, string> = {
  viewing: "Hit c to create",
  dragging: "Hit esc to go back",
  connecting: "Hit esc to go back",
  naming: "Hit esc to go back\nHit enter to submit",
  options: "Hit esc to go back\nHit c to create",
  disabled: "",
  "choosing-connection": "Hit esc to go back"
}

export default function Overlay({ showValidity = true }: { showValidity?: boolean }) {
  const editorState = useEditorState()
  const dispatch = useEditorStateDispatch()
  const mousePosition = useMousePosition()
  const coordinates = useCoordinates()

  const disabled = ["connecting", "naming", "disabled"].includes(editorState.mode.type)

  function handleClickAddPerson() {
    dispatch({
      type: "BEGAN_ADDING_PERSON",
      startPosition: coordinates.screenToWorld(mousePosition.get())
    })
  }

  return (
    <>
      <AddPersonButton 
        disabled={disabled}
        onClick={handleClickAddPerson}
      />
      <span className="absolute right-2 bottom-2 text-right font-mono text-xl text-white whitespace-pre-wrap select-none pointer-events-none">
        {helpTextByMode[editorState.mode.type]}
      </span>
      <span className="absolute bottom-2 left-[48%] font-mono text-xl text-purple-500 select-none pointer-events-none">
        {validate(editorState.graph) ? "valid" : "invalid"}
      </span>
    </>
  )
}