export type Connection = "none" | "child" | "partner" | "parent"
export type PersonCardData = {
  positionX: number
  positionY: number
  width: number
}

// The from property is what began the relationship draft
export type RelationshipDraftBase = {
  from: "partner" | "child" | "parent" | "couple" | "parent-child" | "none"
  newPerson: PersonCardData
}

export type RealRelationshipDraftData = RelationshipDraftBase & (
  | {
      from: "partner" // Connecting from person
      partner: PersonCardData
    }
  | {
      from: "child" // Connecting from person
      child: PersonCardData
    }
  | {
      from: "parent" // Connecting from person
      parent: PersonCardData
    }
  | {
      from: "couple" // Connecting from partner-partner relationship
      firstPartner: PersonCardData
      secondPartner: PersonCardData
    }
  | {
      from: "parent-child" // Connecting from parent-child relationship
      parent: PersonCardData
      child: PersonCardData
    }
  )
export type IndependentDraftData = RelationshipDraftBase & {
  from: "none"
}

// connectingId is a person id if from is partner, child, or parent, and a relationship id otherwise
export type RealRelationshipDraft = RealRelationshipDraftData & {
  connectingId: string
}

export type RelationshipDraftData = RealRelationshipDraftData | IndependentDraftData

export type RelationshipDraft = RealRelationshipDraft | IndependentDraftData

export type RelationshipData =
  | {
      type: "couple"
      firstPartner: PersonCardData
      secondPartner: PersonCardData
      children: PersonCardData[]
    }
  | {
      type: "parent-child"
      parent: PersonCardData
      child: PersonCardData
    }

export type Relationship = RelationshipData & {
  relationshipId: string
}
export type FamilyTreeMode =
  | "dragging"
  | "connecting"
  | "naming"
  | "options"
  | "disabled"
export type ConnectionSet =
  | [Connection]
  | [Connection, Connection]
  | [Connection, Connection, Connection]
