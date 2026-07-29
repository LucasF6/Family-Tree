import { PersonId, RelationshipIndex } from "@/types/family-tree.types"

type FamilyLookup = {
  getAncestry: (people: Set<PersonId> | PersonId) => Set<PersonId>
  getDescendents: (people: Set<PersonId> | PersonId) => Set<PersonId>
}

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

export function getFamilyLookup(index: RelationshipIndex) {
  function getAncestry(people: Set<PersonId> | PersonId): Set<PersonId> {
    return getReachableSet(people, index.parentsById)
  }

  function getDescendents(people: Set<PersonId> | PersonId): Set<PersonId> {
    return getReachableSet(people, index.childrenById)
  }

  return {
    getAncestry,
    getDescendents
  }
}

