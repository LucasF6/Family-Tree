export type Connection = "parent" | "partner" | "child"

export type PersonId = string & { readonly __brand: "PersonId" }
export type RelationshipId = string & { readonly __brand: "RelationshipId" }

export type PersonMode = "disabled" | "draggable" | "connectable"
export type FamilyTreeMode = "viewing" | "dragging" | "disabled" | "connecting" | "naming" | "options" | "choosing-connection"

export type Position = {
  x: number
  y: number
}

export function add(firstPosition: Position, secondPosition: Position) {
  return {
    x: firstPosition.x + secondPosition.x,
    y: firstPosition.y + secondPosition.y
  }
}

export type Dimensions = {
  width: number
  height: number
}

// Where and how wide a person card is on the canvas
export type PersonSpatialData = {
  position: Position
  width: number
}

// Further data about a person
export type PersonData = PersonSpatialData & {
  id: PersonId
  name: string
  age?: number
  picture?: string
  bio?: string
}

export type FamilyGraph = {
  peopleById: Record<PersonId, PersonData>
  peopleIds: PersonId[]
  relationshipsById: Record<RelationshipId, Relationship>
  relationshipIds: RelationshipId[]
}

// Data to draw existing relationships
export type RelationshipData = { id: RelationshipId } & (
  | {
      parents: [PersonSpatialData]
      children: [PersonSpatialData, ...PersonSpatialData[]]
    }
  | {
      parents: [PersonSpatialData, PersonSpatialData]
      children: PersonSpatialData[]
    }
  )

export type RelationshipDraftData =
  | {
      type: Connection
      personConnecting: PersonSpatialData,
      newPerson: PersonSpatialData,
    }
  | {
      type: "couple-child"
      firstPartner: PersonSpatialData
      secondPartner: PersonSpatialData
      newPerson: PersonSpatialData
    }

// Relationships by people ids stored in state
export type Relationship = { id: RelationshipId } & (
  | {
      parents: [PersonId]
      children: [PersonId] // , ...PersonId[]]
    }
  | {
      parents: [PersonId, PersonId]
      children: PersonId[]
    }
)

// A new relationship formed by clicking on the source
// Clicking on a relationship only can result in new children
export type NewRelationshipSource =
  | { kind: "none" }
  | { kind: "person", personId: PersonId }
  | { kind: "relationship", relationshipId: RelationshipId }

export type NewRelationshipSourceWithConnection =
  | { kind: "none" }
  | { kind: "person", personId: PersonId, connection: Connection }
  | { kind: "relationship", relationshipId: RelationshipId}

export type EditorState = {
  graph: FamilyGraph
  mode: EditorMode
}

export type DraftMode = "connecting" | "naming" | "choosing-connection"

export type EditorMode =
  | {
      type: "disabled" | "viewing"
    }
  | {
      type: "dragging"
      personDragging: PersonId
    }
  | {
      type: "options"
      personWithOptions: PersonId
    }
  | {
      type: "connecting" 
      source: NewRelationshipSource
      newPersonPosition: Position
      focusedPerson: PersonId | null
    }
  | { type: "naming"
      source: NewRelationshipSource
      newPersonPosition: Position
    }
  | {
      type: "choosing-connection"
      source: Extract<NewRelationshipSource, { kind: "person" }>
      person: PersonId
    }

export type EditorAction =
  | {
      type: "OPTIONS_OPENED"
      person: PersonId
    }
  | {
      type: "CANCELED"
    }
  | {
      type: "BEGAN_DRAGGING_PERSON"
      person: PersonId
    }
  | {
      type: "FINISHED_DRAGGING_PERSON",
      person: PersonId,
      newPosition: Position
    }
  | {
      type: "CHANGED_PERSON_WIDTH",
      person: PersonId,
      newWidth: number
    }
  | {
      type: "BEGAN_ADDING_PERSON"
      startPosition: Position
    }
  | {
      type: "BEGAN_ADDING_PERSON_FROM_PERSON"
      personId: PersonId
      startPosition: Position
    }
  | {
      type: "BEGAN_ADDING_PERSON_FROM_RELATIONSHIP"
      relationshipId: RelationshipId
      startPosition: Position
    }
  | {
      type: "CHOSE_NEW_PERSON_LOCATION"
      position: Position
    }
  | {
      type: "NAMED_NEW_PERSON"
      fromPerson: false
      name: string
      width: number
    }
  | {
      type: "NAMED_NEW_PERSON"
      fromPerson: true
      name: string
      connection: Connection
      width: number
    }
  | {
      type: "BEGAN_CONNECTING_EXISTING_PERSON"
      person: PersonId
    }
  | {
      type: "CONNECTED_EXISTING_PERSON"
      connection: Connection
    }
  | {
      type: "UPDATED_FOCUSED_PERSON"
      person: PersonId | null
    }
  | {
      type: "UNDO"
    }
  | {
      type: "REDO"
    }
  | {
      type: "DEBUG"
    }

export type EditorHistory = {
  history: FamilyGraph[]
  present: number
  mode: EditorMode
}
    