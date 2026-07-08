export type Connection = "parent" | "partner" | "child"

export type PersonId = string & { readonly __brand: "PersonId" }
export type RelationshipId = string & { readonly __brand: "RelationshipId" }

export type Position = {
  x: number
  y: number
}

// Where and how wide a person card is on the canvas
export type PersonSpatialData = Position & { width: number }

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
  peopleIds: string[]
  relationshipsById: Record<RelationshipId, Relationship>
  relationshipIds: string[]
}

// Data to draw existing relationships
export type RelationshipData =
  | {
      parents: [PersonSpatialData]
      children: [PersonSpatialData, ...PersonSpatialData[]]
    }
  | {
      parents: [PersonSpatialData, PersonSpatialData]
      children: PersonSpatialData[]
    }

// Relationships by people ids stored in state
export type Relationship =
  | {
      parents: [PersonId]
      children: [PersonId, ...PersonId[]]
    }
  | {
      parents: [PersonId, PersonId]
      children: PersonId[]
    }

// A new relationship formed by clicking on the source
// Clicking on a relationship only can result in new children
export type NewRelationshipSource =
        | { kind: "none" }
        | { kind: "person", personId: PersonId }
        | { kind: "relationship", relationshipId: RelationshipId }

export type EditorState = { graph: FamilyGraph } &
  (
    | {
        mode: "dragging" | "disabled"
      }
    | {
        mode: "options"
        personWithOptions: PersonId
      }
    | {
        // The location of new person is determined by mouse coordinates in PersonLocationChooser
        mode: "connecting"
        source: NewRelationshipSource
        initialNewPersonPosition: Position
      }
    | {
        // whether the list of connection choices appears on the left or right
        // and the list of connection choices itself is derived state
        mode: "naming"
        source: Extract<NewRelationshipSource, { kind: "person" }>
        newPersonPosition: Position
        newConnection: Connection
      }
    | {
        mode: "naming"
        source: Exclude<NewRelationshipSource, { kind: "person" }>
        newPersonPosition: Position
      }
  )

export type EditorAction =
  | {
      type: "OPTIONS_OPENED"
      person: PersonId
    }
  | {
      type: "CANCELED"
    }
  | {
      type: "BEGAN_ADDING_PERSON"
      mousePosition: Position
    }
  | {
      type: "BEGAN_ADDING_PERSON_FROM_PERSON"
      personId: PersonId
      mousePosition: Position
    }
  | {
      type: "BEGAN_ADDING_PERSON_FROM_RELATIONSHIP"
      relationshipId: RelationshipId
      mousePosition: Position
    }
  | {
      type: "CHOSE_NEW_PERSON_LOCATION"
      position: Position
    }
  | {
      type: "UPDATED_PERSON_CONNECTION_TYPE"
      newConnection: Connection
    }
  | {
      type: "NAMED_NEW_PERSON"
      name: string
    }
    