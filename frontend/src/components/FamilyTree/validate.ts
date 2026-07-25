import { FamilyGraph, PersonId, Relationship, RelationshipId } from "@/types/family-tree.types";

function isValidParentCount(value: number): boolean {
  return value === 1 || value === 2
}

/**
 * The family graph represents all of the people and relationships between them.
 * A family graph is considered valid if the following are true:
 * 
 * 1. `graph.relationshipIds` and `graph.peopleIds` have no repeats
 * 2. `graph.relationshipsById` and `graph.peopleById` are defined for 
 * each id in the `relationshipIds` and `peopleIds` list respectively
 * 3. `graph.relationshipsById[id].parents` has a length of 1 or 2
 * 4. `graph.relationshipsById[id].parents` and `graph.relationshipsById[id].children` have no repeats
 * 5. Each element of `graph.relationshipsById[id].parents` and `graph.relationshipsById[id].children` are in graph.peopleIds
 * 6. If `graph.relationshipsById[id].parents` has length 1, `graph.relationshipsById[id].children` is nonempty
 * 7. The collection of `graph.relationshipsById[id].children` where `id` is in `graph.relationshipIds` is pairwise disjoint
 * 
 * @param graph The graph to validate
 */
export function validate(graph: FamilyGraph): boolean {
  const relationshipIdsSet: Set<RelationshipId> = new Set(graph.relationshipIds)
  const peopleIdsSet: Set<PersonId> = new Set(graph.peopleIds)
  // Rule 1
  if (relationshipIdsSet.size !== graph.relationshipIds.length || peopleIdsSet.size !== graph.peopleIds.length) {
    return false
  }
  // Rule 2 (people)
  if (graph.peopleIds.some(id => !graph.peopleById[id])) {
    return false
  }
  function isPerson(personId: PersonId) {
    return peopleIdsSet.has(personId)
  }
  const hasParents: Set<PersonId> = new Set()
  for (let relId of graph.relationshipIds) {
    const relationship: Relationship | undefined = graph.relationshipsById[relId]
    // Rule 2 (relationships)
    if (!relationship) {
      return false
    }
    const childrenSet: Set<PersonId> = new Set(relationship.children)
    // Rule 3
    if (!isValidParentCount(relationship.parents.length)) {
      return false
    }
    // Rule 4
    if (childrenSet.size !== relationship.children.length || relationship.parents[0] === relationship.parents[1]) {
      return false
    }
    // Rule 5
    if (!relationship.children.every(isPerson) || !relationship.parents.every(isPerson)) {
      return false
    }
    // Rule 6
    if (relationship.parents.length === 1 && relationship.children.length === 0) {
      return false
    }
    // Rule 7
    for (let childId of relationship.children) {
      if (hasParents.has(childId)) {
        return false
      } else {
        hasParents.add(childId)
      }
    }
  }
  return true
}