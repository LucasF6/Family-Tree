import {
  FamilyGraph,
  NewRelationshipSource,
  PersonId,
  Relationship,
  RelationshipId,
  RelationshipLookup,
} from "@/types/family-tree.types"

function getReachableSet(
  people: Set<PersonId> | PersonId,
  lookup: Record<PersonId, Set<PersonId>>,
): Set<PersonId> {
  const stack: PersonId[] = people instanceof Set ? [...people] : [people]
  const visited: Set<PersonId> = new Set(stack)

  let person: PersonId | undefined
  while ((person = stack.pop())) {
    for (const neighbor of lookup[person]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        stack.push(neighbor)
      }
    }
  }

  return visited
}

export function getUnconnectablePeople(
  { peopleIds, relationshipsById, relationshipIds }: FamilyGraph,
  source: NewRelationshipSource,
  lookup: RelationshipLookup,
) {
  function getAncestry(people: Set<PersonId> | PersonId): Set<PersonId> {
    return getReachableSet(people, lookup.parentsById)
  }

  function getDescendents(people: Set<PersonId> | PersonId): Set<PersonId> {
    return getReachableSet(people, lookup.childrenById)
  }

  switch (source.kind) {
    case "relationship": {
      /**
       * When connecting from a relationship, the new connection must be a child of the relationship. Therefore:
       *
       * 1. The new connection cannot already have two parents
       * 2. If the new connection has a parent, the relationship being connected from cannot have two nor can its
       * singular parent be the parent of the new connection
       * 3. The new connection cannot be a child of the source relationship
       * 4. The new connection cannot be part of either parents' family history
       *
       * family history is defined as follows:
       *
       * The family history of a person includes themself.
       * If the family history of a person includes a person, it must include that person's parents.
       *
       *
       * If all the conditions above are true, the connection should be allowed. If any are false,
       * the person should be considered unconnectable.
       */

      const sourceId: RelationshipId = source.relationshipId
      const sourceRelationship: Relationship = relationshipsById[sourceId]
      const unconnectable: Set<PersonId> = getAncestry(
        new Set(sourceRelationship.parents),
      )

      for (let relId of relationshipIds) {
        const relationship = relationshipsById[relId]
        if (
          relId === sourceId ||
          relationship.parents.length === 2 ||
          sourceRelationship.parents.length === 2 ||
          relationship.parents[0] === sourceRelationship.parents[0]
        ) {
          for (let childId of relationship.children) {
            unconnectable.add(childId)
          }
        }
      }

      return unconnectable
    }
    case "person": {
      /**
       * When connecting from a person, the new connection can either be a parent, child, or partner.
       * The new connection can be a partner when they are different from the source person and
       * not already a partner. The new connection can be a child or parent when similar logic to
       * the above case ("relationship") applies.
       */
      const unconnectable: Set<PersonId> = new Set()

      const sourceId: PersonId = source.personId
      unconnectable.add(sourceId)

      const ancestry: Set<PersonId> = getAncestry(sourceId)
      const descendents: Set<PersonId> = getDescendents(sourceId)

      const parents = lookup.parentsById[sourceId]
      const hasTwoParents: boolean = lookup.parentsById[sourceId].size === 2
      for (let partner of lookup.partnersById[sourceId]) {
        if (
          (ancestry.has(partner) && 
            (hasTwoParents || parents.has(partner))) ||
          (descendents.has(partner) && 
            (lookup.parentsById[partner].size === 2 || lookup.parentsById[partner].has(sourceId)))
        ) {
          unconnectable.add(partner)
        }
      }

      return unconnectable
    }
    default:
      return new Set(peopleIds)
  }
}
