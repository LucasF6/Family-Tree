import { Connection, DraftMode, EditorAction, EditorMode, FamilyGraph, NewRelationshipSource, NewRelationshipSourceWithConnection, PersonSpatialData, Position } from "@/types/family-tree.types"
import { PersonDraft } from "./PersonDraft"
import { useState } from "react"
import { RelationshipDraft } from "./RelationshipDraft"

type DraftProps = {
  graph: FamilyGraph
  mode: Extract<EditorMode, { type: DraftMode }>
  dispatch: (action: EditorAction) => void
}

export default function Draft({ graph, mode, dispatch }: DraftProps) {
  const [connection, setConnection] = useState<Connection>("partner")
  const [newPersonWidth, setNewPersonWidth] = useState(80)
  const [newPersonPosition, setNewPersonPosition] = useState<Position>(mode.type === "choosing-connection" ? { x: 0, y: 0 } : mode.newPersonPosition)

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

  const source: NewRelationshipSource = mode.source
  let sourceWithConnection: NewRelationshipSourceWithConnection
  if (source.kind !== "person") {
    sourceWithConnection = source
  } else if (mode.type !== "connecting" || mode.focusedPerson === null) {
    sourceWithConnection = {
      ...source,
      connection
    }
  } else {
    const relationship = graph.relationshipIds.find(relId => {
      const rel = graph.relationshipsById[relId]
      return rel.parents.length === 2 && ((rel.parents[0] === source.personId && rel.parents[1] === mode.focusedPerson) || (rel.parents[1] === source.personId && rel.parents[0] === mode.focusedPerson))
    })
    sourceWithConnection = {
      ...source,
      connection: relationship ? "child" : "partner"
    }
  }

  let includeConnections: undefined | [Connection, Connection] | [Connection, Connection, Connection]
  let initialConnection: undefined | Connection
  switch (source.kind) {
    case "person":
      initialConnection = "partner"
      const relationshipIdWithParents = graph.relationshipIds.find(relId => graph.relationshipsById[relId].children.find(id => id === source.personId))
      if (relationshipIdWithParents && graph.relationshipsById[relationshipIdWithParents].parents.length === 2) {
        includeConnections = ["partner", "child"]
      } else {
        includeConnections = ["parent", "partner", "child"]
      }
      break
  }

  let showPersonDraft = true
  if (mode.type === "connecting") {
    showPersonDraft = mode.focusedPerson === null
  }

  return (
    <>
      {sourceWithConnection.kind !== "none" && (
        <RelationshipDraft 
          newPersonData={newPersonData}
          source={sourceWithConnection}
          peopleById={graph.peopleById}
          relationshipsById={graph.relationshipsById}
        />
      )}
      {<PersonDraft 
        mode={mode}
        show={showPersonDraft}
        graph={graph}
        initialConnection={initialConnection}
        includeConnections={includeConnections}
        onUpdateConnection={connection => setConnection(connection)}
        onUpdatePosition={position => setNewPersonPosition(position)}
        onUpdateWidth={width => setNewPersonWidth(width)}
        dispatch={dispatch}
      />}
    </>
  )
}

