import { PersonId, PersonData, EditorState, EditorAction, Position, PersonMode, add } from "@/types/family-tree.types"
import { Person } from "./Person"
import { useRef } from "react"

type PeopleProps = {
  editorState: EditorState,
  dispatch: (action: EditorAction) => void
}

export default function People({ editorState, dispatch }: PeopleProps) {
  const focusedPersonId = useRef<PersonId | null>(null)

  const { peopleIds: ids, peopleById: dataById } = editorState.graph

  const modeById: Record<PersonId, PersonMode> = Object.fromEntries(ids.map(id => {
    switch (editorState.mode.type) {
      case "dragging":
        return [id, "draggable"]
      case "connecting":
        // This will need some updating
        return [id, "connectable"]
      default:
        return [id, "disabled"]
    }
  }))

  function handleWidthChange(id: PersonId, width: number) {
    dispatch({
      type: "CHANGED_PERSON_WIDTH",
      person: id,
      newWidth: width
    })
  }

  function handleOpenOptions(id: PersonId) {
    dispatch({
      type: "OPTIONS_OPENED",
      person: id
    })
  }

  function handleStartDrag(id: PersonId) {
    dispatch({
      type: "BEGAN_DRAGGING_PERSON",
      person: id
    })
  }

  function handleEndDrag(id: PersonId, newPosition: Position) {
    dispatch({
      type: "FINISHED_DRAGGING_PERSON",
      person: id,
      newPosition
    })
  }

  function updateFocusedPerson(id: PersonId | null) {
    dispatch({
      type: "UPDATED_FOCUSED_PERSON",
      person: id
    })
  }

  function handleMouseEnter(id: PersonId) {
    if (id !== focusedPersonId.current) {
      focusedPersonId.current = id
      updateFocusedPerson(id)
    }
  }

  function handleMouseLeave(id: PersonId) {
    if (id === focusedPersonId.current) {
      focusedPersonId.current = null
      updateFocusedPerson(null)
    }
  }

  function handleConnect(id: PersonId) {

  }

  return (
    <>
      {ids.map(id => {
        const person = dataById[id]
        return (
          <Person 
            key={id}
            id={id}
            name={person.name}
            mode={modeById[id]}
            position={person.position}
            onWidthChange={handleWidthChange}
            onOpenOptions={handleOpenOptions}
            onStartDrag={handleStartDrag}
            onEndDrag={handleEndDrag}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onConnect={handleConnect}
          />
        )
      })}
    </>
  )
}
