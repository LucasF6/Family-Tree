import { Connection, NewRelationshipSource, NewRelationshipSourceWithConnection, PersonData, PersonId, PersonSpatialData, Position, Relationship, RelationshipDraftData, RelationshipId } from "@/types/family-tree.types"
import { RelationshipPathDraft } from "./RelationshipPathDraft"

type RelationshipDraftProps = {
  newPersonData: PersonSpatialData 
  source: Exclude<NewRelationshipSourceWithConnection, { kind: "none" }>
  peopleById: Record<PersonId, PersonData>
  relationshipsById: Record<RelationshipId, Relationship>
}

export function RelationshipDraft({ newPersonData, source, peopleById, relationshipsById }: RelationshipDraftProps) {
  let data: RelationshipDraftData;
  switch (source.kind) {
    case "person":
      data = {
        type: source.connection,
        personConnecting: peopleById[source.personId],
        newPerson: newPersonData
      }
      break
    case "relationship":
      const relationship = relationshipsById[source.relationshipId]
      if (relationship.parents.length === 1) {
        data = {
          type: "child",
          personConnecting: peopleById[relationship.parents[0]],
          newPerson: newPersonData
        }
      } else {
        data = {
          type: "couple-child",
          firstPartner: peopleById[relationship.parents[0]],
          secondPartner: peopleById[relationship.parents[1]],
          newPerson: newPersonData
        }
      }
      break
  }
  
  return (
    <RelationshipPathDraft
      relationshipDraftData={data}
    />
  )
}
