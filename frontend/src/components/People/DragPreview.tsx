import { FamilyGraph, PersonData, PersonId, PersonSpatialData, Position, RelationshipData, RelationshipId } from "@/types/family-tree.types";
import styles from "./Person.module.css"
import { useEditorState } from "../FamilyTree";
import { produce } from "immer";
import { RelationshipPath } from "../Relationships";
import { useMemo } from "react";

function relationshipsAssociatedWith(id: PersonId, graph: FamilyGraph): RelationshipId[] {
  console.log("relationships!!")
  return graph.relationshipIds.filter(relId => {
    const relationship = graph.relationshipsById[relId]
    return relationship.parents.includes(id) || relationship.children.includes(id)
  })
}

type DragPreviewProps = {
  personId: PersonId
  personData: PersonSpatialData
  previewPosition: Position
}

export function DragPreview({ personId, personData, previewPosition }: DragPreviewProps) {
  const { graph } = useEditorState()
  
  const { peopleById, relationshipsById } = graph
  const initialRelationships: RelationshipId[] = useMemo(
    () => relationshipsAssociatedWith(personId, graph),
    [personId, graph]
  )
  const personPreviewData: PersonSpatialData = {
    position: previewPosition,
    width: personData.width
  }
  const previewRelationshipData: RelationshipData[] = initialRelationships.map(relId => {
    const relationship = relationshipsById[relId]
    const parents: PersonSpatialData[] = relationship.parents.map(parentId => parentId === personId ? personPreviewData : peopleById[parentId])
    const children: PersonSpatialData[] = relationship.children.map(childId => childId === personId ? personPreviewData : peopleById[childId])
    return {
      id: relId,
      parents,
      children
    } as RelationshipData
  })
  
  return (
    <>
      <div  
        className={`
          ${styles.person}
          ${'bg-gray-800'}
        `}
        style={{
          transform: `translate(${personData.position.x}px, ${personData.position.y}px) translate(-50%, -50%)`,
          width: personData.width
        }}
      />
      {previewRelationshipData.map(relationshipData => (
        <RelationshipPath 
          key={relationshipData.id}
          data={relationshipData}
          disabled
          dotted
        />
      ))}
    </>
  )
}
