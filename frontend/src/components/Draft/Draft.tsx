import { Connection, DraftMode, EditorAction, EditorMode, FamilyGraph, NewRelationshipSource, NewRelationshipSourceWithConnection, PersonId, PersonSpatialData, Position } from "@/types/family-tree.types"
import { PersonDraft } from "./PersonDraft"
import { useState } from "react"
import { RelationshipDraft } from "./RelationshipDraft"

type DraftProps = {
  graph: FamilyGraph
  mode: Extract<EditorMode, { type: DraftMode }>
  dispatch: (action: EditorAction) => void
}

export default function Draft({ graph, mode, dispatch }: DraftProps) {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [newPersonWidth, setNewPersonWidth] = useState(80)
  const [newPersonPosition, setNewPersonPosition] = useState<Position>(mode.type === "choosing-connection" ? { x: 0, y: 0 } : mode.newPersonPosition)
  
  const source: NewRelationshipSource = mode.source

  let newPersonData: PersonSpatialData
  if (mode.type === "choosing-connection") {
    newPersonData = graph.peopleById[mode.person]
  } else if (mode.type === "connecting" && mode.focusedPerson !== null) {
    newPersonData = graph.peopleById[mode.focusedPerson]
  } else {
    newPersonData = {
      position: newPersonPosition,
      width: newPersonWidth
    }
  }

  
  let includeConnections: Connection[] = []
  let initialConnection: undefined | Connection
  if (mode.type === "naming" && source.kind === "person") {
    initialConnection = "partner"
    const relationshipIdWithParents = graph.relationshipIds.find(relId => graph.relationshipsById[relId].children.find(id => id === source.personId))
    if (relationshipIdWithParents && graph.relationshipsById[relationshipIdWithParents].parents.length === 2) {
      includeConnections = ["partner", "child"]
    } else {
      includeConnections = ["parent", "partner", "child"]
    }
  } else if (mode.type === "choosing-connection" && source.kind === "person") {
    /**
     * I need to know:
     * 1. does the "to person" have two parents? If yes they can't be the child of the "from person"
     * 2. is the "to person" the "from person"'s partner? If yes they can't be a new partner
     * 3. is the "to person" the "from person"'s child? If yes they can't be the parent or child
     * 4. is the "to person" the "from person"'s parent? If yes they can't be the parent or child
    */
   const fromId: PersonId = source.personId
   const toId: PersonId = mode.person
   // These variables are named respective to the "to person"
   let hasTwoParents: boolean = false
   let isPartner: boolean = false
   let isParent: boolean = false
   let isChild: boolean = false
   graph.relationshipIds.forEach(id => {
     const relationship = graph.relationshipsById[id]
     if (relationship.children.includes(toId)) {
       if (relationship.parents.length === 2) {
         hasTwoParents = true
        }
        if (relationship.parents.includes(fromId)) {
          isChild = true
        }
      }
      if (relationship.parents.includes(toId)) {
        if (relationship.children.includes(fromId)) {
          isParent = true
        }
        if (relationship.parents.includes(fromId)) {
          isPartner = true
        }
      }
    })
    if (hasTwoParents) {
      initialConnection = "partner"
      includeConnections = ["parent", "partner"]
    } else if (isPartner) {
      initialConnection = "child"
      includeConnections = ["parent", "child"]
    } else {
      initialConnection = "partner"
      includeConnections = ["parent", "partner", "child"]
    }
  }
  
  let sourceWithConnection: NewRelationshipSourceWithConnection
  if (source.kind !== "person") {
    sourceWithConnection = source
  } else {
    sourceWithConnection = {
      ...source,
      connection: connection ?? initialConnection ?? "partner"
    }
  } 

  let showPersonDraft = true
  if (mode.type === "connecting") {
    showPersonDraft = mode.focusedPerson === null
  }
  
  return (
    <>
      <PersonDraft 
        mode={mode}
        show={showPersonDraft}
        graph={graph}
        initialConnection={initialConnection}
        includeConnections={includeConnections}
        onUpdateConnection={connection => setConnection(connection)}
        onUpdatePosition={position => setNewPersonPosition(position)}
        onUpdateWidth={width => setNewPersonWidth(width)}
        dispatch={dispatch}
      />
      {sourceWithConnection.kind !== "none" && (
        <RelationshipDraft 
          newPersonData={newPersonData}
          source={sourceWithConnection}
          peopleById={graph.peopleById}
          relationshipsById={graph.relationshipsById}
        />
      )}
    </>
  )
}
