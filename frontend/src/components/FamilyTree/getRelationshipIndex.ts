import { FamilyGraph, PersonId, Relationship, RelationshipIndex } from "@/types/family-tree.types";

export function getRelationshipIndex({ peopleIds, relationshipIds, relationshipsById }: FamilyGraph): RelationshipIndex {
  const partnersById: Record<PersonId, Set<PersonId>> = {}
  const parentsById: Record<PersonId, Set<PersonId>> = {}
  const childrenById: Record<PersonId, Set<PersonId>> = {}

  for (let id of peopleIds) {
    partnersById[id] = new Set()
    parentsById[id] = new Set()
    childrenById[id] = new Set()
  }

  for (let relId of relationshipIds) {
    const relationship: Relationship = relationshipsById[relId]
    if (relationship.parents.length === 2) {
      partnersById[relationship.parents[0]].add(relationship.parents[1])
      partnersById[relationship.parents[1]].add(relationship.parents[0])
    }
    for (let parentId of relationship.parents) {
      for (let childId of relationship.children) {
        parentsById[childId].add(parentId)
        childrenById[parentId].add(childId)
      }
    }
  }

  return {
    partnersById,
    parentsById,
    childrenById
  }
}
