'use client'

import { PersonId } from "@/types/family-tree.types";
import styles from "./OptionsBubble.module.css"
import { useEditorState, useEditorStateDispatch } from "../FamilyTree";

/**
 * This component provides the options to
 * 
 * 1. Go to the person's page
 * 2. Edit the person in the canvas
 * 2. Delete the person
 */
export default function OptionsBubble() {
  const editorState = useEditorState()
  const dispatch = useEditorStateDispatch()

  if (editorState.mode.type !== "options") {
    return
  }

  const person = editorState.graph.peopleById[editorState.mode.personWithOptions]

  function handleEdit(personId: PersonId) {
    dispatch({
      type: "OPENED_PERSON_SETTINGS",
      personId
    })
  }
  
  function handleDelete(personId: PersonId) {
    dispatch({
      type: "DELETED_PERSON",
      personId 
    })
  }

  return (
    <div 
      className={styles['options-bubble']}
      style={{
        "--x": `${person.position.x + person.width / 2}px`,
        "--y": `${person.position.y}px`,
      } as React.CSSProperties}
      onPointerDown={e => e.stopPropagation()}
    >
      <button 
        className="bg-blue-400 hover:cursor-pointer hover:bg-blue-500 text-xl font-mono h-6 [image-rendering:pixelated]"
        onClick={() => {}}
      >
        Page
      </button>
      <button 
        className="bg-green-400 hover:cursor-pointer hover:bg-green-500 text-xl font-mono h-6 [image-rendering:pixelated]"
        onClick={() => handleEdit(person.id)}
      >
        Edit
      </button>
      <button 
        className="bg-red-400 hover:cursor-pointer hover:bg-red-500 text-xl font-mono h-6 [image-rendering:pixelated]"
        onClick={() => handleDelete(person.id)}
      >
        Delete
      </button>
    </div>
  )
}