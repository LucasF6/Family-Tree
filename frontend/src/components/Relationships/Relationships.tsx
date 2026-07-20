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
import { useCoordinates } from "@/components/Canvas/context"

type RelationshipsProps = {
  graph: FamilyGraph
  disabled: boolean
  dispatch: (action: Extract<EditorAction, { type: "BEGAN_ADDING_PERSON_FROM_RELATIONSHIP" }>) => void
}

export function Relationships({
  graph: { peopleById, relationshipsById, relationshipIds },
  disabled, dispatch
}: RelationshipsProps) {
  const coordinates = useCoordinates()

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
