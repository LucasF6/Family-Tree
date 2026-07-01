'use client'

import styles from "./FamilyTree.module.css"
import { useState, useRef, useEffect } from "react";
import Person from "@/components/Person";
import { PointerEvent } from "react";
import { Connection } from "@/types";
import ErrorMessage from "@/components/ErrorMessage";
import { v4 as uuid } from 'uuid'
import Relationship from "../Relationship";
import PersonNamer from "@/components/PersonNamer";

type FamilyTreeMode = "dragging" | "connecting" | "naming" | "options"

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
  const [screenPosition, setScreenPosition] = useState({x: 0, y: 0})
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0})
  const [newPersonPosition, setNewPersonPosition] = useState({x: 0, y: 0})
  const [personConnecting, setPersonConnecting] = useState<PersonType | null>(null)
  const [newPersonRelationshipPossibilitiesRight, setNewPersonRelationshipPossibilitiesLeft] = useState(false)
  const [newPersonWidth, setNewPersonWidth] = useState(80)
  const [newPersonConnection, setNewPersonConnection] = useState<Connection>("partner")
  const [errorMessage, setErrorMessage] = useState("")
  const [errorMessageKey, setErrorMessageKey] = useState("")

  let newPersonConnectionPath;
  if (mode === "naming" && personConnecting) {
    switch (newPersonConnection) {
      case "parent":
        newPersonConnectionPath = 
          `
            M ${personConnecting.positionX + screenPosition.x} ${personConnecting.positionY + screenPosition.y - 30}
            C ${personConnecting.positionX + screenPosition.x} ${personConnecting.positionY + screenPosition.y - 30 - 50},
              ${newPersonPosition.x + screenPosition.x} ${newPersonPosition.y + screenPosition.y + 30 + 50},
              ${newPersonPosition.x + screenPosition.x} ${newPersonPosition.y + screenPosition.y + 30}
          `
        break
      case "partner":
        newPersonConnectionPath = personConnecting.positionX >= newPersonPosition.x
        ? `
            M ${personConnecting.positionX + screenPosition.x - personConnecting.width / 2} ${personConnecting.positionY + screenPosition.y}
            C ${personConnecting.positionX + screenPosition.x - personConnecting.width / 2 - 50} ${personConnecting.positionY + screenPosition.y},
              ${newPersonPosition.x + screenPosition.x + newPersonWidth / 2 + 50} ${newPersonPosition.y + screenPosition.y},
              ${newPersonPosition.x + screenPosition.x + newPersonWidth / 2} ${newPersonPosition.y + screenPosition.y}
            `
        : `
            M ${personConnecting.positionX + screenPosition.x + personConnecting.width / 2} ${personConnecting.positionY + screenPosition.y}
            C ${personConnecting.positionX + screenPosition.x + personConnecting.width / 2 + 50} ${personConnecting.positionY + screenPosition.y},
              ${newPersonPosition.x + screenPosition.x - newPersonWidth / 2 - 50} ${newPersonPosition.y + screenPosition.y},
              ${newPersonPosition.x + screenPosition.x - newPersonWidth / 2} ${newPersonPosition.y + screenPosition.y}
          `
        break
        case "child":
        newPersonConnectionPath = 
          `
            M ${personConnecting.positionX + screenPosition.x} ${personConnecting.positionY + screenPosition.y + 30}
            C ${personConnecting.positionX + screenPosition.x} ${personConnecting.positionY + screenPosition.y + 30 + 50},
              ${newPersonPosition.x + screenPosition.x} ${newPersonPosition.y + screenPosition.y - 30 - 50},
              ${newPersonPosition.x + screenPosition.x} ${newPersonPosition.y + screenPosition.y - 30}
          `
        break
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
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
    }

    if (mode === "connecting" || mode === "naming" || mode === "options") {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode])

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
        x: clientX,
        y: clientY
      })
    } else {
      
    }
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
    }
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    isDragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (isDragging.current && (mode === "dragging" || mode === "naming")) {
      setScreenPosition({
        x: e.clientX + dragOffset.x,
        y: e.clientY + dragOffset.y
      })
    } else if (mode === "connecting") {
      setNewPersonPosition({
        x: e.clientX,
        y: e.clientY
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
    if (personConnecting === null) return
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
      switch (connection) {
        case "parent":
          // This part needs to be fixed
          if (prev.parentsByChildId[personConnecting.id]?.length === 2) {
            return prev
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
          break
      }
      return next;
    });
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
        case "none":
          return prev
      }
      next.push(newRelationship)
      return next
    })
    setMode("dragging")
    // reset values back to defaults
    setNewPersonWidth(80)
    setNewPersonConnection("partner")
  }

  return (
    <div 
      className={styles.container}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      // ref={ref}
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
            />
          )
        }
      })}
      {mode === "connecting" && (
        <>
          <div 
            className={styles["new-person"]}
            style={{
              "--x": `${newPersonPosition.x}px`,
              "--y": `${newPersonPosition.y}px`
            } as React.CSSProperties}
          />
          {personConnecting && (
            <svg className={styles.connection}>
              <path stroke="white" strokeWidth="2" fill="none" d=
                {
                  newPersonPosition.x >= personConnecting.positionX + screenPosition.x
                    ? `
                        M ${personConnecting.positionX + personConnecting.width / 2 + screenPosition.x} ${personConnecting.positionY + screenPosition.y}
                        C ${personConnecting.positionX + personConnecting.width / 2 + screenPosition.x + 50} ${personConnecting.positionY + screenPosition.y},
                        ${newPersonPosition.x - 40 - 50} ${newPersonPosition.y},
                        ${newPersonPosition.x - 40} ${newPersonPosition.y}
                      `
                    : `
                        M ${personConnecting.positionX - personConnecting.width / 2 + screenPosition.x} ${personConnecting.positionY + screenPosition.y}
                        C ${personConnecting.positionX - personConnecting.width / 2 + screenPosition.x - 50} ${personConnecting.positionY + screenPosition.y},
                        ${newPersonPosition.x + 40 + 50} ${newPersonPosition.y},
                        ${newPersonPosition.x + 40} ${newPersonPosition.y}
                      `
                }
              />
            </svg>
          )}
        </>
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
          <svg className={styles.connection}>
            <path stroke="white" strokeWidth="2" fill="none" d={newPersonConnectionPath} />
          </svg>
          <PersonNamer 
            positionX={newPersonPosition.x + screenPosition.x} 
            positionY={newPersonPosition.y + screenPosition.y}
            onUpdateConnection={handleUpdatePersonNamerConnection}
            onUpdateWidth={handleUpdatePersonNamerWidth}
            onSubmit={handlePersonNamerSubmit}
            isConnected
            right={newPersonRelationshipPossibilitiesRight}
          />
        </>
      )}

      <ErrorMessage message={errorMessage} key={errorMessageKey} />
    </div>
  );
}
