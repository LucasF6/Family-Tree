export type Connection = "none" | "child" | "partner" | "parent";
export type PersonCardData = {
  positionX: number;
  positionY: number;
  width: number;
}
export type RelationshipPathData = 
  | {
      type: "partner-partner"
      firstPartner: PersonCardData
      secondPartner: PersonCardData
    }
  | {
      type: "parent-child"
      parent: PersonCardData
      child: PersonCardData
    }
export type FamilyTreeMode = "dragging" | "connecting" | "naming" | "options" | "disabled"
export type ConnectionSet = [Connection] | [Connection, Connection] | [Connection, Connection, Connection]