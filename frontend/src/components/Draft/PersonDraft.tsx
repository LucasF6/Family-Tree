import { Dimensions, EditorMode, Position, DraftMode, Connection, EditorAction, PersonData, PersonId, Relationship, RelationshipId, PersonSpatialData, FamilyGraph } from "@/types/family-tree.types"
import { PersonDraftLocationChooser } from "./PersonDraftLocationChooser"
import PersonNamer from "./PersonNamer"
import { useEffect, useRef, useState } from "react"
import { useCoordinates } from "../Canvas/CanvasProvider"
import RelationshipOptions from "../RelationshipOptions"

type PersonDraftProps = {
  mode: Extract<EditorMode, { type: DraftMode }>
  graph: FamilyGraph
  show: boolean
  includeConnections?: [Connection, Connection] | [Connection, Connection, Connection]
  initialConnection?: Connection
  onUpdateConnection: (connection: Connection) => void
  onUpdatePosition: (position: Position) => void
  onUpdateWidth: (width: number) => void
  dispatch: (action: Extract<EditorAction, { type: "CHOSE_NEW_PERSON_LOCATION" | "NAMED_NEW_PERSON" | "CONNECTED_EXISTING_PERSON" }>) => void
}

export function PersonDraft({ mode, graph, show, initialConnection, includeConnections, onUpdateConnection, onUpdateWidth, onUpdatePosition, dispatch }: PersonDraftProps) {
  const [connection, setConnection] = useState<Connection>(initialConnection ?? "partner")
  const [position, setPosition]= useState<Position>(mode.type === "connecting" ? mode.newPersonPosition : { x: 0, y: 0 })
  const positionRef = useRef<Position>(position)

  const coordinates = useCoordinates()

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    function handlePointerDown() {
      dispatch({
        type: "CHOSE_NEW_PERSON_LOCATION",
        position: positionRef.current
      })
    }

    function handlePointerMove(e: PointerEvent) {
      const newPosition = coordinates.screenToWorld({
        x: e.clientX,
        y: e.clientY
      })

      setPosition(newPosition)
      onUpdatePosition(newPosition)
    }

    if (mode.type === "connecting") {
      window.addEventListener("pointerdown", handlePointerDown)
      window.addEventListener("pointermove", handlePointerMove)
    }

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("pointermove", handlePointerMove)
    }
  }, [onUpdatePosition, mode])

  function handleUpdateConnection(connection: Connection) {
    setConnection(connection)
    onUpdateConnection(connection)
  }

  if (!show) {
    return
  } else if (mode.type === "connecting") {
    return (
      <PersonDraftLocationChooser 
        position={position}
        hasShadow={mode.source.kind === "none"}
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

    let optionsOnRight: boolean = true
    if (mode.source.kind === "person") {
      optionsOnRight = graph.peopleById[mode.source.personId].position.x < mode.newPersonPosition.x
    }

    return (
      <PersonNamer 
        position={mode.newPersonPosition}
        includeConnections={includeConnections}
        onUpdateConnection={handleUpdateConnection}
        onUpdateWidth={onUpdateWidth}
        onSubmit={handleSubmit}
        right={optionsOnRight}
      />
    )
  } else if (mode.type === "choosing-connection") {
    const person = graph.peopleById[mode.person]

    let optionsOnRight: boolean = true
    if (mode.source.kind === "person") {
      optionsOnRight = graph.peopleById[mode.source.personId].position.x < person.position.x
    }

    function handleSubmit(connection: Connection) {
      dispatch({
        type: "CONNECTED_EXISTING_PERSON",
        connection
      })
    }

    return (
      <RelationshipOptions 
        position={{
          x: optionsOnRight ? person.position.x + person.width / 2 + 70 + 20 : person.position.x - person.width / 2 - 70 - 20,
          y: person.position.y
        }}
        includeConnections={["parent", "partner", "child"]}
        onClick={handleSubmit}
        onHover={handleUpdateConnection}
        animation={optionsOnRight ? "right" : "left"}
      />
    )
  }
}
