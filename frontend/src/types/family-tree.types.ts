export type Connection = "parent" | "partner" | "child"

// Where and how wide a person card is on the canvas
export type PersonSpatialData = {
  x: number
  y: number
  width: number
}

// Further data about a person
export type PersonData = PersonSpatialData & {
  id: string
  name: string
  age?: number
  picture?: string
  bio?: string
}

// People graph stored in state
export type People = {
  byId: Record<string, PersonData>
  partnersById: Record<string, string[]>
  parentsById: Record<string, [] | [string] | [string, string]>
  childrenById: Record<string, string[]>
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
      parents: [string]
      children: [string, ...string[]]
    }
  | {
      parents: [string, string]
      children: string[]
    }

// A new relationship formed by clicking on the source
// Clicking on a relationship only can result in new children
export type RelationshipDraft =
  | {
      source: "person"
      personId: string
      newConnection: Connection 
    }
  | {
      source: "relationship"
      relationshipId: string
    }

export type EditorState =
  | {
      mode: "dragging" | "options" | "disabled"
    }
  | {
      // The location of new person is determined by mouse coordinates in PersonLocationChooser
      // relationshipDraft is unused if the connection is independent of people or relationships
      mode: "connecting"
      relationshipDraft?: RelationshipDraft
    }
  | {
    // whether the list of connection choices appears on the left or right
    // and the list of connection choices itself is derived state
      mode: "naming"
      relationshipDraft: RelationshipDraft
      newPerson: PersonSpatialData
    }