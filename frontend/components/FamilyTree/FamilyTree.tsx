'use client'

import styles from "./FamilyTree.module.css"
import { useState, useRef, useEffect } from "react";
import Person from "@/components/Person";
import { PointerEvent } from "react";
import { Connection, ConnectionSet } from "@/types";
import ErrorMessage from "@/components/ErrorMessage";
import { v4 as uuid } from 'uuid'
import Relationship from "../Relationship";
import PersonNamer from "@/components/PersonNamer";
import PersonLocationChooser from "../PersonLocationChooser";
import Overlay from "../Overlay";
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

let count = 3;

function createPerson(name: string, initX: number, initY: number) {
  count++
  return {
    name: name,
    id: uuid(),
    positionX: initX,
    positionY: initY,
    mode: "draggable",
    width: 0,
    parents: [],
    children: new Map()
  } as PersonType
}

const defaultPeople = {
  byId: {
    "1": {
      name: "Leonardo da Vinci",
      id: "1",
      positionX: 200,
      positionY: 200,
      mode: "draggable",
      width: 0,
    },
    "2": {
      name: "Michelangelo",
      id: "2",
      positionX: 300,
      positionY: 300,
      mode: "draggable",
      width: 0,
    },
    "3": {
      name: "Boticelli",
      id: "3",
      positionX: 400,
      positionY: 400,
      mode: "draggable",
      width: 0,
    }
  },
  ids: ["1", "2", "3"],
  parentsByChildId: {},
  childrenByParentId: {}
} as People

export default function FamilyTree() {
  const [mode, setMode] = useState<FamilyTreeMode>("dragging")
  const [people, setPeople] = useState<People>(defaultPeople)
  const [relationships, setRelationships] = useState<RelationshipType[]>([])
  const isDragging = useRef(false)
  const mousePosition = useRef({x: 0, y: 0})
  const [screenPosition, setScreenPosition] = useState({x: 0, y: 0})
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0})
  const [newPersonPosition, setNewPersonPosition] = useState({x: 0, y: 0})
  const [personConnecting, setPersonConnecting] = useState<PersonType | null>(null)
  const [newPersonRelationshipPossibilitiesRight, setNewPersonRelationshipPossibilitiesLeft] = useState(false)
  const [newPersonWidth, setNewPersonWidth] = useState(80)
  const [newPersonConnection, setNewPersonConnection] = useState<Connection>("partner")
  const [errorMessage, setErrorMessage] = useState("")
  const [errorMessageKey, setErrorMessageKey] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [includeConnections, setIncludeConnections] = useState<ConnectionSet | null>()
  
  const newPersonData = {
    positionX: newPersonPosition.x,
    positionY: newPersonPosition.y,
    width: newPersonWidth
  }
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (mode === "connecting" || mode === "naming" || mode === "options") {
          setMode("dragging")
          setNewPersonWidth(80)
          setNewPersonConnection("partner")
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
        if (mode === "dragging" || mode === "options") {
          startAddingNewPerson()
        }
      }
    }
    
    if (mode !== "disabled") {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode])

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
      setMode("options")
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
      setMode("dragging")
    }
  }
  
  function handleConnect(personId: string, clientX: number, clientY: number) {
    if (mode !== "connecting") {
      setMode("connecting")
      setPeople(prev => ({
        ...prev,
        byId: Object.fromEntries(prev.ids.map(id => [id, {
          ...prev.byId[id],
          mode: personId === id ? "disabled" : "connectable"
        }]))
      }))
      setPersonConnecting(people.byId[personId])
      setNewPersonPosition({
        x: clientX - screenPosition.x,
        y: clientY - screenPosition.y
      })
    }
  }
  
  function startAddingNewPerson() {
    setMode("connecting")
    setPeople(prev => ({
      ...prev,
      byId: Object.fromEntries(prev.ids.map(id => [id, {
        ...prev.byId[id],
        mode: "disabled"
      }]))
    }))
    setPersonConnecting(null)
    setNewPersonPosition({
      x: mousePosition.current.x - screenPosition.x,
      y: mousePosition.current.y - screenPosition.y
    })
    setNewPersonConnection("none")
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
    if (mode === "dragging" || mode === "naming") {
      isDragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragOffset({
        x: screenPosition.x - e.clientX,
        y: screenPosition.y - e.clientY
      })
    } else if (mode === "connecting") {
      setNewPersonPosition({
        x: e.clientX - screenPosition.x,
        y: e.clientY - screenPosition.y
      })
      setPeople(prev => ({
        ...prev,
        byId: Object.fromEntries(prev.ids.map(id => [id, {
          ...prev.byId[id],
          mode: "disabled"
        }]))
      }))
      setMode("naming")
      // This code puts the options menu to the left/right depending on the side of screen its on
      // if (!ref.current) return
      // setNewPersonRelationshipPossibilitiesLeft(e.clientX < ref.current.getBoundingClientRect().width / 2)
      if (!personConnecting) return
      setNewPersonRelationshipPossibilitiesLeft(e.clientX >= personConnecting.positionX + screenPosition.x)
    
      if ((people.parentsByChildId[personConnecting.id]?.length || 0) == 2) {
        setIncludeConnections(["partner", "child"])
      } else {
        setIncludeConnections(["parent", "partner", "child"])
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
    if (isDragging.current && (mode === "dragging" || mode === "naming")) {
      setScreenPosition({
        x: e.clientX + dragOffset.x,
        y: e.clientY + dragOffset.y
      })
    } else if (mode === "connecting") {
      setNewPersonPosition({
        x: e.clientX - screenPosition.x,
        y: e.clientY - screenPosition.y
      })
    }
  }

  function handleUpdatePersonNamerConnection(connection: Connection) {
    setNewPersonConnection(connection)
  }

  function handleUpdatePersonNamerWidth(width: number){
    setNewPersonWidth(width)
  }

  function handlePersonNamerSubmit(connection: Connection, name: string) {
    if (name === "") {
      updateErrorMessage("Error: Empty text")
      return
    }
    let newPerson = createPerson(name, newPersonPosition.x, newPersonPosition.y)
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
      if (personConnecting === null || connection === "none") {
        return next
      }
      switch (connection) {
        case "parent":
          // This part needs to be fixed
          if (prev.parentsByChildId[personConnecting.id]?.length === 2) {
            return prev
          }
          next.childrenByParentId = {
            ...next.childrenByParentId,
            [newPerson.id]: [
              personConnecting.id
            ]
          }
          next.parentsByChildId = {
            ...next.parentsByChildId,
            [personConnecting.id]: [
              ...prev.parentsByChildId[personConnecting.id] || [],
              newPerson.id
            ] as [string] | [string, string]
          }
          break
        case "child":
          next.childrenByParentId = {
            ...next.childrenByParentId,
            [personConnecting.id]: [
              ...prev.childrenByParentId[personConnecting.id] || [],
              newPerson.id
            ]
          }
          next.parentsByChildId = {
            ...next.parentsByChildId,
            [newPerson.id]: [
              personConnecting.id
            ]
          }
          break
        }
        return next;
      });
      setMode("dragging")
      // reset values back to defaults
      setNewPersonWidth(80)
      setNewPersonConnection("partner")
      if (personConnecting === null || connection === "none") {
        return
      }
      setRelationships(prev => {
      let newRelationship: RelationshipType;
      let next = [...prev]
      switch (connection) {
        case "parent":
          let parents = people.parentsByChildId[personConnecting.id] || []
          if (parents.length === 1) {
            next = next.filter(rel => rel.type !== "parent-child" || rel.parent !== parents[0])
            newRelationship = {
              type: "partner-partner",
              id: uuid(),
              firstPartner: parents[0],
              secondPartner: newPerson.id,
              children: [personConnecting.id]
            }
          } else {
            newRelationship = {
              type: "parent-child",
              id: uuid(),
              parent: newPerson.id,
              child: personConnecting.id
            }
          }
          break
        case "partner":
          newRelationship = {
            type: "partner-partner",
            id: uuid(),
            firstPartner: personConnecting.id,
            secondPartner: newPerson.id,
            children: []
          }
          break
        case "child":
          newRelationship = {
            type: "parent-child",
            id: uuid(),
            parent: personConnecting.id,
            child: newPerson.id
          }
          break
      }
      next.push(newRelationship)
      return next
    })
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
        if (relationship.type == "parent-child") {
          return (
            <Relationship 
              type="parent-child"
              key={relationship.id}
              parent={people.byId[relationship.parent]}
              child={people.byId[relationship.child]}
              screenPositionX={screenPosition.x}
              screenPositionY={screenPosition.y}
              clickable={mode === "dragging" || mode === "options"}
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
              clickable={mode === "dragging" || mode === "options"}
              onClick={() => handleAddPersonFromRelationship(relationship.id)}
            />
          )
        }
      })}
      {mode === "connecting" && (
        <PersonLocationChooser 
          screenPositionX={screenPosition.x}
          screenPositionY={screenPosition.y}
          newPersonData={newPersonData}
          isConnected={newPersonConnection !== "none"}
          personConnectingData={personConnecting}
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
      {mode === "naming" && (
        <>
          {newPersonConnection !== "partner" && newPersonConnection !== "none" && personConnecting && (
            <Relationship 
              type="parent-child"
              parent={newPersonConnection === "parent" ? newPersonData : personConnecting}
              child={newPersonConnection === "parent" ? personConnecting : newPersonData}
              screenPositionX={screenPosition.x}
              screenPositionY={screenPosition.y}
            />
          )}
          {newPersonConnection === "partner" && personConnecting && (
            <Relationship 
              type="partner-partner"
              firstPartner={personConnecting}
              secondPartner={newPersonData}
              screenPositionX={screenPosition.x}
              screenPositionY={screenPosition.y}
            />
          )}
          <PersonNamer 
            positionX={newPersonPosition.x + screenPosition.x} 
            positionY={newPersonPosition.y + screenPosition.y}
            onUpdateConnection={handleUpdatePersonNamerConnection}
            onUpdateWidth={handleUpdatePersonNamerWidth}
            onSubmit={handlePersonNamerSubmit}
            includeConnections={includeConnections || ["partner"]}
            isConnected={newPersonConnection !== "none"}
            right={newPersonRelationshipPossibilitiesRight}
          />
        </>
      )}
      <Overlay 
        disabled={mode !== "dragging" && mode !== "options"}
        onAddPerson={startAddingNewPerson}
        helpText={mode}
      /> 
      <ErrorMessage message={errorMessage} key={errorMessageKey} />
    </div>
  );
}
