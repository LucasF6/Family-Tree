
import styles from "./FamilyTree.module.css"
import { useState, useRef, useEffect } from "react";
import Person from "@/components/Person";
import { PointerEvent } from "react";
import PersonCreator from "@/components/PersonCreator";
import { Connection } from "@/types";
import ErrorMessage from "@/components/ErrorMessage";
import { v4 as uuid } from 'uuid'

type FamilyTreeMode = "dragging" | "connecting" | "naming" | "options"

type PersonType = {
  name: string;
  id: number;
  positionX: number;
  positionY: number;
  width: number;
  mode: "draggable" | "connectable" | "disabled" | "options";
  parents: [] | [PersonType] | [PersonType, PersonType];
  children: Map<PersonType, PersonType[]>
}

let count = 0;

function createPerson(name: string, initX: number, initY: number) {
  count++
  return {
    name: name,
    id: count,
    positionX: initX,
    positionY: initY,
    mode: "draggable",
    width: 0,
    parents: [],
    children: new Map()
  } as PersonType
}

export default function FamilyTree() {
  const [mode, setMode] = useState<FamilyTreeMode>("dragging")
  const [people, setPeople] = useState<PersonType[]>([
    createPerson("Leonardo da Vinci", 200, 200),
    createPerson("Michelangelo", 300, 300),
    createPerson("Boticelli", 400, 400)
  ])
  const isDragging = useRef(false)
  const [screenPosition, setScreenPosition] = useState({x: 0, y: 0})
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0})
  const [newPersonPosition, setNewPersonPosition] = useState({x: 0, y: 0})
  const [personConnecting, setPersonConnecting] = useState<PersonType | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const [newPersonRelationshipPossibilitiesLeft, setNewPersonRelationshipPossibilitiesLeft] = useState(false)
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
          prev.map(person => ({
            ...person,
            mode: "draggable"
          }))
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

  function handleClick(idx: number) {
    setPeople(prev => {
      const person = prev[idx]
      if (!person) return prev

      return [
        ...prev.slice(0, idx),
        ...prev.slice(idx + 1),
        person
      ]
    })
  }

  function handleOptions(idx: number) {
    if (people[idx].mode === "draggable") {
      setPeople(prev => 
        prev.map((person, index) => ({
          ...person,
          mode: idx === index ? "options" : "draggable"
        }))
      )
      setMode("options")
    } else if (people[idx].mode === "options") {
      setPeople(prev => 
        prev.map(person => ({
          ...person,
          mode: "draggable"
        }))
      )
      setMode("dragging")
    }
  }

  function handleConnect(idx: number, clientX: number, clientY: number) {
    if (mode !== "connecting") {
      setMode("connecting")
      setPeople(prev => prev.map((person, index) => ({
        ...person,
        mode: idx === index ? "disabled" : "connectable"
      })))
      setPersonConnecting(people[idx])
      setNewPersonPosition({
        x: clientX,
        y: clientY
      })
    } else {
      
    }
  }

  function handleUpdatePosition(idx: number, x: number, y: number) {
    setPeople(prev => 
      prev.map((person, index) =>
        index === idx
          ? { ...person, positionX: x - screenPosition.x, positionY: y - screenPosition.y }
          : person
      )
    )
  }

  function handleUpdateWidth(idx: number, width: number) {
    setPeople(prev =>
      prev.map((person, index) =>
        index === idx
          ? { ...person, width}
          : person
      )
    )
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
      setPeople(prev => 
        prev.map(person => ({
          ...person,
          mode: "disabled"
        })
      ))
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

  function handleUpdatePersonCreatorConnection(connection: Connection) {
    setNewPersonConnection(connection)
  }

  function handleUpdatePersonCreatorWidth(width: number){
    setNewPersonWidth(width)
  }

  function handlePersonCreatorSubmit(connection: Connection, name: string) {
    if (name === "") {
      updateErrorMessage("Error: Empty text")
      return
    }
    setPeople(prev => [
      ...prev.map(p => ({ ...p, mode: "draggable" } as PersonType)),
      createPerson(name, newPersonPosition.x, newPersonPosition.y)
    ])
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
      {people.map((person, idx) => (
        <Person
          name={person.name}
          positionX={person.positionX + screenPosition.x}
          positionY={person.positionY + screenPosition.y}
          updatePosition={(x, y) => handleUpdatePosition(idx, x, y)}
          updateWidth={width => handleUpdateWidth(idx, width)}
          onClick={() => handleClick(idx)}
          onOptions={() => handleOptions(idx)}
          onConnect={(clientX, clientY) => handleConnect(idx, clientX, clientY)}
          mode={person.mode}
          key={person.id}
        />
      ))}
      {mode === "naming" && (
        <>
          <svg className={styles.connection}>
            <path stroke="white" strokeWidth="2" fill="none" d={newPersonConnectionPath} />
          </svg>
          <PersonCreator 
            positionX={newPersonPosition.x + screenPosition.x} 
            positionY={newPersonPosition.y + screenPosition.y}
            onUpdateConnection={handleUpdatePersonCreatorConnection}
            onUpdateWidth={handleUpdatePersonCreatorWidth}
            onSubmit={handlePersonCreatorSubmit}
            isConnected
            left={newPersonRelationshipPossibilitiesLeft}
          />
        </>
      )}
      <ErrorMessage message={errorMessage} key={errorMessageKey} />
    </div>
  );
}
