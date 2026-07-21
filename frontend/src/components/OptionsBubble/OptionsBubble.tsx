import { PersonData, PersonId, Position } from "@/types/family-tree.types";
import styles from "./OptionsBubble.module.css"
import { useEditorState, useEditorStateDispatch } from "../FamilyTree";
import { useCoordinates, useMousePosition } from "../Canvas/CanvasProvider";

export default function OptionsBubble() {
  const editorState = useEditorState()
  const dispatch = useEditorStateDispatch()
  const mousePosition = useMousePosition()
  const coordinates = useCoordinates()

  if (editorState.mode.type !== "options") {
    return
  }

  const person = editorState.graph.peopleById[editorState.mode.personWithOptions]
  
  function handleClickConnect(personId : PersonId) {
    dispatch({
      type: "BEGAN_ADDING_PERSON_FROM_PERSON",
      personId,
      startPosition: coordinates.screenToWorld(mousePosition.get())
    })
  }

  return (
    <div 
      className={styles['options-bubble']}
      style={{
        "--x": `${person.position.x}px`,
        "--y": `${person.position.y}px`,
      } as React.CSSProperties}
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="grid grid-cols-2">
        <button 
          className="bg-amber-400 hover:cursor-pointer hover:bg-amber-500 text-4xl font-mono"
          onClick={() => {}}
        >
          Edit
        </button>
        <button 
          className="bg-blue-400 hover:cursor-pointer hover:bg-blue-500 text-4xl font-mono"
          onClick={() => {}}
        >
          Page
        </button>
      </div>
      <button 
        className="bg-green-400 hover:cursor-pointer hover:bg-green-500 text-4xl font-mono"
        onClick={() => handleClickConnect(person.id)}
      >
        Connect
      </button>
    </div>
  )
}