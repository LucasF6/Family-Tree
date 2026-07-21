import {
  EditorAction,
  FamilyGraph,
  PersonId,
  PersonSpatialData,
  Position,
  RelationshipData,
  RelationshipId,
} from "@/types/family-tree.types"
import { RelationshipPath } from "."
import { useCoordinates } from "@/components/Canvas/CanvasProvider"
import { useEditorState, useEditorStateDispatch } from "../FamilyTree/EditorStateProvider"

type RelationshipsProps = {
  graph: FamilyGraph
  disabled: boolean
  dispatch: (action: Extract<EditorAction, { type: "BEGAN_ADDING_PERSON_FROM_RELATIONSHIP" }>) => void
}

export function Relationships() {
  const editorState = useEditorState()
  const dispatch = useEditorStateDispatch()
  const coordinates = useCoordinates()

  const { peopleById, relationshipIds, relationshipsById } = editorState.graph
  const disabled = editorState.mode.type !== "dragging"

  const relationshipData: RelationshipData[] = relationshipIds.map(relId => ({
    id: relId,
    parents: relationshipsById[relId].parents.map(id => peopleById[id]) as PersonSpatialData[],
    children: relationshipsById[relId].children.map(id  => peopleById[id]) as PersonSpatialData[]
  } as RelationshipData))

  function handleClick(id: RelationshipId, position: Position) {
    dispatch({
      type: "BEGAN_ADDING_PERSON_FROM_RELATIONSHIP",
      relationshipId: id,
      startPosition: coordinates.screenToWorld(position)
    })
  }

  return (
    <>
      {relationshipData.map(relationshipData => {
        return (
          <RelationshipPath 
            key={relationshipData.id}
            data={relationshipData}
            disabled={disabled}
            onClick={position => handleClick(relationshipData.id, position)}
          />
        )
      })}
    </>
  )
}
