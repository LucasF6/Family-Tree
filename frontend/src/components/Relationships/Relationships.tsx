import {
  FamilyGraph,
  Relationship,
  RelationshipData,
  RelationshipId,
} from "@/types/family-tree.types"

type RelationshipsProps = {
  graph: FamilyGraph
}

export default function Relationships({
  graph: { peopleById, peopleIds, relationshipsById, relationshipIds },
}: RelationshipsProps) {
  
}