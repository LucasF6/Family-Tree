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
 * 8. The collection of `graph.relationshipsById[id].parents` where `id` is in `graph.relationshipIds` has no repeats
 * 9. The directed graph pointing parents to children is acyclic
 * 
 * TODO: add that there can be no cycles, add no repetitions of parent combinations
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
  // Consider someone their own partner in a relationship by themself
  const partnersById: Record<PersonId, Set<PersonId>> = Object.fromEntries(graph.peopleIds.map(id => [id, new Set()]))
  const childrenById: Record<PersonId, Set<PersonId>> = Object.fromEntries(graph.peopleIds.map(id => [id, new Set()]))
  const parentsById: Record<PersonId, Set<PersonId>> = Object.fromEntries(graph.peopleIds.map(id => [id, new Set()]))
  for (let relId of graph.relationshipIds) {
    const relationship: Relationship | undefined = graph.relationshipsById[relId]
    // Rule 2 (relationships)
    if (!relationship) {
      return false
    }
    const childrenSet: Set<PersonId> = new Set(relationship.children)
    const { parents, children } = relationship
    // Rule 3
    if (!isValidParentCount(parents.length)) {
      return false
    }
    // Rule 4
    if (childrenSet.size !== children.length || parents[0] === parents[1]) {
      return false
    }
    // Rule 5
    if (!children.every(isPerson) || !parents.every(isPerson)) {
      return false
    }
    // Rule 6
    if (parents.length === 1 && children.length === 0) {
      return false
    }
    // Rule 7
    for (let childId of children) {
      if (hasParents.has(childId)) {
        return false
      } else {
        hasParents.add(childId)
      }
    }
    // Rule 8
    if (parents.length === 1 && partnersById[parents[0]].has(parents[0])) {
      return false
    } else if (parents.length === 1) {
      partnersById[parents[0]].add(parents[0]) 
      children.forEach(child => { // Building childrenById and parentsById for rule 9
        parentsById[child].add(parents[0])
        childrenById[parents[0]].add(child)
      })
    }
    if (parents.length === 2 && (partnersById[parents[0]].has(parents[1]) || partnersById[parents[1]].has(parents[0]))) {
      return false
    } else if (parents.length === 2) {
      partnersById[parents[0]].add(parents[1])
      partnersById[parents[1]].add(parents[0])
      children.forEach(child => { // Building childrenById and parentsById for rule 9
        parentsById[child].add(parents[0])
        parentsById[child].add(parents[1])
        childrenById[parents[0]].add(child)
        childrenById[parents[1]].add(child)
      })
    }
  }
  // Rule 9 (Determining acyclicity using Kahn's algorithm)
  const indegreeById: Record<PersonId, number> = Object.fromEntries(graph.peopleIds.map(id => [id, parentsById[id].size]))
  const stack: PersonId[] = graph.peopleIds.filter(id => indegreeById[id] === 0)
  let removeCount = stack.length

  let person: PersonId | undefined
  while (person = stack.pop()) {
    for (let child of childrenById[person]) {
      indegreeById[child] -= 1
      if (indegreeById[child] === 0) {
        stack.push(child)
        removeCount++
      }
    }
  }
  if (removeCount !== graph.peopleIds.length) {
    return false
  }
  // All tests passed, so the graph is valid
  return true
}
