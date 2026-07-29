import { Connection, PersonId, RelationshipIndex } from "@/types/family-tree.types";
import { getFamilyLookup } from "../People/getFamilyLookup";

/** Computes the list of possible connection from a source person to a new person */
export function getConnections(from: PersonId, to: PersonId, index: RelationshipIndex): Connection[] {
  const { getAncestry, getDescendents } = getFamilyLookup(index)
  const connections: Connection[] = []

  const fromParents: Set<PersonId> = index.parentsById[from]
  const toParents: Set<PersonId> = index.parentsById[to]

  const fromHasTwoParents: boolean = fromParents.size === 2
  const toHasTwoParents: boolean = toParents.size === 2

  console.log(toParents)

  if (!fromHasTwoParents && !getDescendents(from).has(to) && !fromParents.has(to)) {
    connections.push("parent")
  }
  if (from !== to && !index.partnersById[from].has(to)) {
    connections.push("partner")
  }
  if (!toHasTwoParents && !getAncestry(from).has(to) && !toParents.has(from)) {
    connections.push("child")
  }

  return connections
}