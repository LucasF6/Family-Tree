import { Dimensions, EditorMode, Position, DraftMode, Connection, EditorAction, PersonData, PersonId, Relationship, RelationshipId, PersonSpatialData } from "@/types/family-tree.types"
import { PersonDraftLocationChooser } from "./PersonDraftLocationChooser"
import PersonNamer from "./PersonNamer"
import { useState } from "react"

type PersonDraftProps = {
  mode: Extract<EditorMode, { type: DraftMode }>
  includeConnections?: [Connection, Connection] | [Connection, Connection, Connection]
  initialConnection?: Connection
  onUpdateConnection: (connection: Connection) => void
  onUpdatePosition: (position: Position) => void
  onUpdateWidth: (width: number) => void
  dispatch: (action: Extract<EditorAction, { type: "CHOSE_NEW_PERSON_LOCATION" | "NAMED_NEW_PERSON" }>) => void
}

export function PersonDraft({ mode, initialConnection, includeConnections, onUpdateConnection, onUpdateWidth, onUpdatePosition, dispatch }: PersonDraftProps) {
  const [connection, setConnection] = useState<Connection>(initialConnection ?? "partner")
  
  if (mode.type === "connecting") {
    function handleChooseLocation(position: Position) {
      dispatch({
        type: "CHOSE_NEW_PERSON_LOCATION",
        position
      })
    }

    return (
      <PersonDraftLocationChooser 
        initialPosition={mode.newPersonPosition}
        hasShadow={mode.source.kind === "none"}
        onChooseLocation={handleChooseLocation}
        onUpdatePosition={onUpdatePosition}
      />
    )
  } else if (mode.type === "naming") {
    function handleSubmit(name: string) {
      if (mode.source.kind === "person") {
        dispatch({
          type: "NAMED_NEW_PERSON",
          fromPerson: true,
          name,
          connection
        })
      } else {
        dispatch({
          type: "NAMED_NEW_PERSON",
          fromPerson: false,
          name
        })
      }
    }

    function handleUpdateConnection(connection: Connection) {
      setConnection(connection)
      onUpdateConnection(connection)
    }

    return (
      <PersonNamer 
        position={mode.newPersonPosition}
        includeConnections={includeConnections}
        onUpdateConnection={handleUpdateConnection}
        onUpdateWidth={onUpdateWidth}
        onSubmit={handleSubmit}
      />
    )
  } else if (mode.type === "choosing-connection") {

  }
}
