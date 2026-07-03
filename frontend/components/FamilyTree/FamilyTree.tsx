'use client'

import styles from "./FamilyTree.module.css"
import { useState, useRef, useEffect } from "react";
import Person from "@/components/Person";
import { PointerEvent } from "react";
import { Connection, ConnectionSet, PersonCardData, RelationshipPathData } from "@/types";
import ErrorMessage from "@/components/ErrorMessage";
import { v4 as uuid } from 'uuid'
import Relationship from "@/components/Relationship";
import PersonNamer from "@/components/PersonNamer";
import PersonLocationChooser from "@/components/PersonLocationChooser";
import Overlay from "@/components/Overlay";
import { FamilyTreeMode } from "@/types";

type PersonType = {
  name: string;
  id: string;
  positionX: number;
  positionY: number;
  width: number;
  mode: "draggable" | "connectable" | "disabled" | "options";
}

type People = {
  byId: Record<string, PersonType>;
  ids: string[];
  parentsByChildId: Record<string, [] | [string] | [string, string]>;
  childrenByParentId: Record<string, string[]>;
}

type RelationshipType =
  | {
      type: "parent-child";
      id: string;
      parent: string; // Person ID
      child: string; // Person ID
    }
  | {
      type: "partner-partner";
      id: string;
      firstPartner: string; // Person ID
      secondPartner: string; // Person ID
      children: string[]; // Person IDs
    }

type EditorState =
  | {
      state: "dragging"
    }
  | {
      state: "options"
    }
  | {
      state: "connecting"
      independent: true
      newPersonData: PersonCardData
    }
  | {
      state: "connecting"
      independent: false
      personConnectingData: PersonCardData
      personConnectingId: string
      newPersonData: PersonCardData
      connection: Exclude<Connection, "none"> // What the new person is to the person being connected
    }
  | {
      state: "naming"
      independent: true
      newPersonData: PersonCardData
    }
  | {
      state: "naming"
      independent: false
      personConnectingData: PersonCardData
      personConnectingId: string
      newPersonData: PersonCardData
      connection: Exclude<Connection, "none">
      connectionOptions: ConnectionSet
      relationshipOptionsOnRight: boolean
    }
  | {
      state: "disabled"
    }

function createPerson(name: string, initX: number, initY: number) {
  return {
    name: name,
    id: uuid(),
    positionX: initX,
    positionY: initY,
    mode: "draggable",
    width: 0,
  } as PersonType
}

const defaultPeople = {
  byId: {},
  ids: [],
  parentsByChildId: {},
  childrenByParentId: {}
} as People

export default function FamilyTree() {
  const [editorState, setEditorState] = useState<EditorState>({state: "dragging"})
  const [people, setPeople] = useState<People>(defaultPeople)
  const [relationships, setRelationships] = useState<RelationshipType[]>([])
  const isDragging = useRef(false)
  const mousePosition = useRef({x: 0, y: 0})
  const [screenPosition, setScreenPosition] = useState({x: 0, y: 0})
  const dragOffset = useRef({x: 0, y: 0}) // This can be a ref
  const [errorMessage, setErrorMessage] = useState("")
  const [errorMessageKey, setErrorMessageKey] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (["connecting", "naming", "options"].includes(editorState.state)) {
          setEditorState({state: "dragging"})
          setPeople(prev => (
            {
              ...prev,
              byId: Object.fromEntries(prev.ids.map(personId => ([personId, {
                ...prev.byId[personId],
                mode: "draggable"
              }])))
            }
          ))
        }
      } else if (e.key === "c") {
        if (["dragging", "options"].includes(editorState.state)) {
          startAddingNewPerson()
        }
      }
    }
    
    if (editorState.state !== "disabled") {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editorState.state])

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
      setHeight(entry.contentRect.height)
    })

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])
  
  function updateErrorMessage(message: string) {
    setErrorMessage(message)
    setErrorMessageKey(uuid())
  }
  
  function handleClick(index: number) {
    setPeople(prev => ({
      ...prev,
      ids: [
        ...prev.ids.slice(0, index),
        ...prev.ids.slice(index + 1),
        prev.ids[index]
      ]
    }))
  }
  
  function handleOptions(id: string) {
    if (people.byId[id].mode === "draggable") {
      setPeople(prev => ({
        ...prev,
        byId: {
          ...prev.byId,
          [id]: {
            ...prev.byId[id],
            mode: "options"
          }
        }
      }))
      // setMode("options")
      setEditorState({state: "options"})
    } else if (people.byId[id].mode === "options") {
      setPeople(prev => ({
        ...prev,
        byId: {
          ...prev.byId,
          [id]: {
            ...prev.byId[id],
            mode: "draggable" // Do i need to set everyone to draggable?
          }
        }
      }))
      setEditorState({state: "dragging"})
    }
  }
  
  function handleConnect(personId: string, clientX: number, clientY: number) {
    if (editorState.state !== "connecting") {
      setPeople(prev => ({
        ...prev,
        byId: Object.fromEntries(prev.ids.map(id => [id, {
          ...prev.byId[id],
          mode: personId === id ? "disabled" : "connectable"
        }]))
      }))
      setEditorState({
        state: "connecting",
        independent: false,
        personConnectingId: personId,
        personConnectingData: people.byId[personId],
        newPersonData: {
          positionX: clientX - screenPosition.x,
          positionY: clientY - screenPosition.y,
          width: 80
        },
        connection: "partner"
      })
    }
  }
  
  function startAddingNewPerson() {
    setPeople(prev => ({
      ...prev,
      byId: Object.fromEntries(prev.ids.map(id => [id, {
        ...prev.byId[id],
        mode: "disabled"
      }]))
    }))
    setEditorState({
      state: "connecting",
      independent: true,
      newPersonData: {
        positionX: mousePosition.current.x - screenPosition.x,
        positionY: mousePosition.current.y - screenPosition.y,
        width: 80
      }
    })
  }

  function handleAddPersonFromRelationship(relationshipId: string) {
    console.log(relationshipId)
  }

  function handleUpdatePosition(id: string, x: number, y: number) {
    setPeople(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [id]: {
          ...prev.byId[id],
          positionX: x - screenPosition.x,
          positionY: y - screenPosition.y
        }
      }
    }))
  }

  function handleUpdateWidth(id: string, width: number) {
    setPeople(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [id]: {
          ...prev.byId[id],
          width
        }
      }
    }))
  }


  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (["dragging", "naming"].includes(editorState.state)) {
      isDragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      dragOffset.current = {
        x: screenPosition.x - e.clientX,
        y: screenPosition.y - e.clientY
      }
    } else if (editorState.state === "connecting") {
      setPeople(prev => ({
        ...prev,
        byId: Object.fromEntries(prev.ids.map(id => [id, {
          ...prev.byId[id],
          mode: "disabled"
        }]))
      }))
      if (editorState.independent) {
        setEditorState({
          state: "naming",
          independent: true,
          newPersonData: {
            positionX: e.clientX - screenPosition.x,
            positionY: e.clientY - screenPosition.y,
            width: 80
          },
        })
      } else {
        setEditorState({
          ...editorState,
          state: "naming",
          independent: false,
          newPersonData: {
            positionX: e.clientX - screenPosition.x,
            positionY: e.clientY - screenPosition.y,
            width: 80
          },
          relationshipOptionsOnRight: e.clientX >= editorState.personConnectingData.positionX + screenPosition.x,
          connectionOptions: people.parentsByChildId[editorState.personConnectingId]?.length === 2 ? ["partner", "child"] : ["parent", "partner", "child"],
        })
      }
    }
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    isDragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    mousePosition.current.x = e.clientX
    mousePosition.current.y = e.clientY
    if (isDragging.current && ["dragging", "naming"].includes(editorState.state)) {
      setScreenPosition({
        x: e.clientX + dragOffset.current.x,
        y: e.clientY + dragOffset.current.y
      })
    } else if (editorState.state === "connecting") {
      setEditorState({
        ...editorState,
        newPersonData: {
          ...editorState.newPersonData,
          positionX: e.clientX - screenPosition.x,
          positionY: e.clientY - screenPosition.y
        }
      })
    }
  }

  function handleUpdatePersonNamerConnection(connection: Connection) {
    setEditorState(prev => {
      if (prev.state !== "naming" || prev.independent || connection === "none") return prev
      return {
        ...prev,
        connection
      }
    })
  }

  function handleUpdatePersonNamerWidth(width: number){
    if (editorState.state === "connecting" || editorState.state === "naming") {
      setEditorState({
        ...editorState,
        newPersonData: {
          ...editorState.newPersonData,
          width
        }
      })
    }
  }

  function handlePersonNamerSubmit(connection: Connection, name: string) {
    if (name === "") {
      updateErrorMessage("Error: Empty text")
      return
    }
    if (editorState.state !== "naming") {
      return
    }
    let newPerson = createPerson(name, editorState.newPersonData.positionX, editorState.newPersonData.positionY)
    setPeople(prev => {
      const next = {
        ...prev,
        byId: {
          ...Object.fromEntries(
            prev.ids.map((id) => [
              id,
              {
                ...prev.byId[id],
                mode: "draggable",
              } as PersonType,
            ]),
          ),
          [newPerson.id]: newPerson,
        },
        ids: [...prev.ids, newPerson.id],
      }
      if (editorState.independent) {
        return next
      }
      switch (editorState.connection) {
        case "parent":
          // This part needs to be fixed
          if (prev.parentsByChildId[editorState.personConnectingId]?.length === 2) {
            return prev
          }
          next.childrenByParentId = {
            ...next.childrenByParentId,
            [newPerson.id]: [
              editorState.personConnectingId
            ]
          }
          next.parentsByChildId = {
            ...next.parentsByChildId,
            [editorState.personConnectingId]: [
              ...prev.parentsByChildId[editorState.personConnectingId] || [],
              newPerson.id
            ] as [string] | [string, string]
          }
          break
        case "child":
          next.childrenByParentId = {
            ...next.childrenByParentId,
            [editorState.personConnectingId]: [
              ...prev.childrenByParentId[editorState.personConnectingId] || [],
              newPerson.id
            ]
          }
          next.parentsByChildId = {
            ...next.parentsByChildId,
            [newPerson.id]: [
              editorState.personConnectingId
            ]
          }
          break
        }
      return next;
    });
    if (!editorState.independent) {
      setRelationships(prev => {
        let newRelationship: RelationshipType;
        let next = [...prev]
        switch (editorState.connection) {
          case "parent":
            let parents = people.parentsByChildId[editorState.personConnectingId] || []
            if (parents.length === 1) {
              next = next.filter(rel => rel.type !== "parent-child" || rel.parent !== parents[0])
              newRelationship = {
                type: "partner-partner",
                id: uuid(),
                firstPartner: parents[0],
                secondPartner: newPerson.id,
                children: [editorState.personConnectingId]
              }
            } else {
              newRelationship = {
                type: "parent-child",
                id: uuid(),
                parent: newPerson.id,
                child: editorState.personConnectingId
              }
            }
            break
          case "partner":
            newRelationship = {
              type: "partner-partner",
              id: uuid(),
              firstPartner: editorState.personConnectingId,
              secondPartner: newPerson.id,
              children: []
            }
            break
          case "child":
            newRelationship = {
              type: "parent-child",
              id: uuid(),
              parent: editorState.personConnectingId,
              child: newPerson.id
            }
            break
        }
        next.push(newRelationship)
        return next
      })
    }
    setEditorState({state: "dragging"})
  }

  return (
    <div 
      className={styles.container}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      ref={ref}
    >
      {relationships.map(relationship => {
        if (relationship.type === "parent-child") {
          return (
            <Relationship 
              type="parent-child"
              key={relationship.id}
              parent={people.byId[relationship.parent]}
              child={people.byId[relationship.child]}
              screenPositionX={screenPosition.x}
              screenPositionY={screenPosition.y}
              clickable={["dragging", "options"].includes(editorState.state)}
              onClick={() => handleAddPersonFromRelationship(relationship.id)}
            />
          )
        } else {
          return (
            <Relationship 
              type="partner-partner"
              key={relationship.id}
              firstPartner={people.byId[relationship.firstPartner]}
              secondPartner={people.byId[relationship.secondPartner]}
              children={relationship.children.map(child => people.byId[child])}
              screenPositionX={screenPosition.x}
              screenPositionY={screenPosition.y}
              clickable={["dragging", "options"].includes(editorState.state)}
              onClick={() => handleAddPersonFromRelationship(relationship.id)}
            />
          )
        }
      })}
      {editorState.state === "connecting" && (
        <PersonLocationChooser 
          screenPositionX={screenPosition.x}
          screenPositionY={screenPosition.y}
          newPersonData={editorState.newPersonData}
          isConnected={!editorState.independent}
          personConnectingData={editorState.independent ? null : editorState.personConnectingData}
          screenWidth={width}
          screenHeight={height}
        />
      )}
      {people.ids.map((id, index) => {
        const person = people.byId[id]
        return (
          <Person
            name={person.name}
            positionX={person.positionX + screenPosition.x}
            positionY={person.positionY + screenPosition.y}
            updatePosition={(x, y) => handleUpdatePosition(person.id, x, y)}
            updateWidth={width => handleUpdateWidth(person.id, width)}
            onClick={() => handleClick(index)}
            onOptions={() => handleOptions(person.id)}
            onConnect={(clientX, clientY) => handleConnect(person.id, clientX, clientY)}
            mode={person.mode}
            key={person.id}
          />
        )
      })}
      {editorState.state === "naming" && (
        <>
          {!editorState.independent && editorState.connection !== "partner" && (
            <Relationship 
              type="parent-child"
              parent={editorState.connection === "parent" ? editorState.newPersonData : editorState.personConnectingData}
              child={editorState.connection === "parent" ? editorState.personConnectingData : editorState.newPersonData}
              screenPositionX={screenPosition.x}
              screenPositionY={screenPosition.y}
            />
          )}
          {!editorState.independent && editorState.connection === "partner" && (
            <Relationship 
              type="partner-partner"
              firstPartner={editorState.personConnectingData}
              secondPartner={editorState.newPersonData}
              screenPositionX={screenPosition.x}
              screenPositionY={screenPosition.y}
            />
          )}
          <PersonNamer 
            positionX={editorState.newPersonData.positionX + screenPosition.x} 
            positionY={editorState.newPersonData.positionY + screenPosition.y}
            onUpdateConnection={handleUpdatePersonNamerConnection}
            onUpdateWidth={handleUpdatePersonNamerWidth}
            onSubmit={handlePersonNamerSubmit}
            includeConnections={editorState.independent ? undefined : editorState.connectionOptions}
            isConnected={!editorState.independent}
            right={editorState.independent ? undefined : editorState.relationshipOptionsOnRight}
          />
        </>
      )}
      <Overlay 
        disabled={["connecting", "naming", "disabled"].includes(editorState.state)}
        onAddPerson={startAddingNewPerson}
        helpText={editorState.state}
      /> 
      <ErrorMessage message={errorMessage} key={errorMessageKey} />
    </div>
  );
}
