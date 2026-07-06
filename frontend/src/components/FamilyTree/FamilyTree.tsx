'use client'

import styles from "./FamilyTree.module.css"
import { useState, useRef, useEffect } from "react";
import Person from "@/src/components/Person";
import { PointerEvent } from "react";
import { Connection, ConnectionSet, PersonCardData, RelationshipDraft, Relationship, IndependentDraftData, RealRelationshipDraft, RelationshipDraftBase, RelationshipData, EditorState } from "@/src/types";
import ErrorMessage from "@/src/components/ErrorMessage";
import { v4 as uuid } from 'uuid'
import { RelationshipPath } from "@/src/components/RelationshipPath";
import { RelationshipPathDraft } from "@/src/components/RelationshipPath"
import PersonNamer from "@/src/components/PersonNamer";
import PersonLocationChooser from "@/src/components/PersonLocationChooser";
import Overlay from "@/src/components/Overlay";
import { FamilyTreeMode } from "@/src/types";
import { produce } from "immer";

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

  if (editorState.state === "connecting") {
    const myVariable = "hello!"
  }
  
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
      } else if (e.key === "q") {
        console.log(mousePosition.current.x, mousePosition.current.y)
        if (editorState.state === "connecting") {
          console.log(editorState.relationshipDraft.newPerson.positionX + screenPosition.x, editorState.relationshipDraft.newPerson.positionY + screenPosition.y)
        }
      }
    }
    
    if (editorState.state !== "disabled") {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editorState.state, startAddingNewPerson]) // May change this later to fix wrong-location bug in person-creation

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
      setHeight(entry.contentRect.height)
    })

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  const relationshipData: Relationship[] = relationships.map(relationship => (
    relationship.type === "partner-partner"
      ? {
          type: "couple",
          firstPartner: people.byId[relationship.firstPartner],
          secondPartner: people.byId[relationship.secondPartner],
          children: relationship.children.map(child => people.byId[child]),
          relationshipId: relationship.id
        }
      : {
          type: "parent-child",
          parent: people.byId[relationship.parent],
          child: people.byId[relationship.child],
          relationshipId: relationship.id 
        }
  ))
  
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
        relationshipDraft: {
          from: "partner",
          partner: people.byId[personId],
          connectingId: personId,
          newPerson: {
            positionX: clientX - screenPosition.x,
            positionY: clientY - screenPosition.y,
            width: 80
          }
        }
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
      relationshipDraft: {
        from: "none",
        newPerson: {
          positionX: mousePosition.current.x - screenPosition.x,
          positionY: mousePosition.current.y - screenPosition.y,
          width: 80
        }
      }
    })
  }

  function handleAddPersonFromRelationship(relationship: Relationship) {
    if (relationship.type === "couple") {
      setEditorState({
        state: "connecting",
        independent: false,
        relationshipDraft: {
          from: "couple",
          firstPartner: relationship.firstPartner,
          secondPartner: relationship.secondPartner,
          newPerson: {
            positionX: mousePosition.current.x - screenPosition.x,
            positionY: mousePosition.current.y - screenPosition.y,
            width: 80
          },
          connectingId: relationship.relationshipId
        }
      })
    } else {
      setEditorState({
        state: "connecting",
        independent: false,
        relationshipDraft: {
          from: "parent-child",
          parent: relationship.parent,
          child: relationship.child,
          newPerson: {
            positionX: mousePosition.current.x - screenPosition.x,
            positionY: mousePosition.current.y - screenPosition.y,
            width: 80
          },
          connectingId: relationship.relationshipId
        }
      })
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

  function getConnectingOptions(draft: RealRelationshipDraft): ConnectionSet {
    switch (draft.from) {
      case "couple":
      case "parent-child":
        return ["child"]
      default:
        if (people.parentsByChildId[draft.connectingId]?.length === 2) {
          return ["partner", "child"]
        } else {
          return ["parent", "partner", "child"]
        }
    }
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
          relationshipDraft: {
            from: "none", 
            newPerson: {
              positionX: e.clientX - screenPosition.x,
              positionY: e.clientY - screenPosition.y,
              width: 80
            }
          }
        })
      } else {
        setEditorState({
          ...editorState,
          state: "naming",
          independent: false,
          relationshipDraft: {
            ...editorState.relationshipDraft,
            newPerson: {
              positionX: mousePosition.current.x - screenPosition.x,
              positionY: mousePosition.current.y - screenPosition.y,
              width: 80
            },
          },
          relationshipOptionsOnRight: editorState.relationshipDraft.from === "partner" 
            ? editorState.relationshipDraft.newPerson.positionX > editorState.relationshipDraft.partner.positionX : true,
          connectionOptions: getConnectingOptions(editorState.relationshipDraft)
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
      // setEditorState(prev => {
      //   if (prev.state !== "connecting") return prev;
      //   return {
      //     ...prev,
      //     relationshipDraft: {
      //       ...prev.relationshipDraft,
      //       newPerson: {
      //         positionX: e.clientX - screenPosition.x,
      //         positionY: e.clientY - screenPosition.y,
      //         width: prev.relationshipDraft.newPerson.width
      //       }
      //     }
      //   } as typeof prev
      // })
      setEditorState(prev => produce(prev, draft => {
        if (draft.state !== "connecting") return
        draft.relationshipDraft.newPerson = {
          positionX: e.clientX - screenPosition.x,
          positionY: e.clientY - screenPosition.y,
          width: draft.relationshipDraft.newPerson.width
        }
      }))
    }
  }

  function handleUpdatePersonNamerConnection(connection: Connection) {
    setEditorState(prev => {
      if (prev.state !== "naming" || prev.independent || prev.relationshipDraft.from === "couple" || prev.relationshipDraft.from === "parent-child") {
        return prev
      }
      let personConnecting: PersonCardData
      switch (prev.relationshipDraft.from) {
        case "parent": personConnecting = prev.relationshipDraft.parent; break
        case "partner": personConnecting = prev.relationshipDraft.partner; break
        case "child": personConnecting = prev.relationshipDraft.child; break
      }
      const next = {...prev}
      switch (connection) {
        case "parent": next.relationshipDraft = {...next.relationshipDraft, from: "child", child: personConnecting}; break
        case "partner": next.relationshipDraft = {...next.relationshipDraft, from: "partner", partner: personConnecting}; break
        case "child": next.relationshipDraft = {...next.relationshipDraft, from: "parent", parent: personConnecting}; break
      }
      return next
    })
  }

  function handleUpdatePersonNamerWidth(width: number){
    setEditorState(prev => {
      if (prev.state === "connecting" || prev.state === "naming") {
        const next = {...prev}
        next.relationshipDraft.newPerson.width = width
        return next
      }
      return prev
    })
  }

  function handlePersonNamerSubmit(name: string) {
    if (name === "") {
      updateErrorMessage("Error: Empty text")
      return
    }
    if (editorState.state !== "naming") {
      return
    }
    let newPerson = createPerson(name, editorState.relationshipDraft.newPerson.positionX, editorState.relationshipDraft.newPerson.positionY)
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
      switch (editorState.relationshipDraft.from) {
        case "child": {
          // The relationship draft being from a child means new person is their parent
          // This condition should never be true
          if (prev.parentsByChildId[editorState.relationshipDraft.connectingId]?.length === 2) {
            return prev
          }
          next.childrenByParentId = {
            ...next.childrenByParentId,
            [newPerson.id]: [
              editorState.relationshipDraft.connectingId
            ]
          }
          next.parentsByChildId = {
            ...next.parentsByChildId,
            [editorState.relationshipDraft.connectingId]: [
              ...prev.parentsByChildId[editorState.relationshipDraft.connectingId] || [],
              newPerson.id
            ] as [string] | [string, string]
          }
          break
        } 
        case "parent": {
          // The relationship draft being from a parent means new person is their child
          next.childrenByParentId = {
            ...next.childrenByParentId,
            [editorState.relationshipDraft.connectingId]: [
              ...prev.childrenByParentId[editorState.relationshipDraft.connectingId] || [],
              newPerson.id
            ]
          }
          next.parentsByChildId = {
            ...next.parentsByChildId,
            [newPerson.id]: [
              editorState.relationshipDraft.connectingId
            ]
          }
          break
        }
        case "couple": {
          // The relationship draft being from a couple means the new person is their child
          const relationship = relationships.find(rel => rel.id === editorState.relationshipDraft.connectingId)
          // This condition should never be true
          if (relationship?.type !== "partner-partner") {
            return prev
          }
          next.childrenByParentId = {
            ...next.childrenByParentId,
            [relationship.firstPartner]: [
              ...next.childrenByParentId[relationship.firstPartner] || [],
              newPerson.id
            ],
            [relationship.secondPartner]: [
              ...next.childrenByParentId[relationship.secondPartner] || [],
              newPerson.id
            ]
          }
          next.parentsByChildId = {
            ...next.parentsByChildId,
            [newPerson.id]: [relationship.firstPartner, relationship.secondPartner]
          }
          break
        }
        case "parent-child": {
          // The relationship draft being from a parent child means new person is a child of the parent
          const relationship = relationships.find(rel => rel.id === editorState.relationshipDraft.connectingId)
          // This condition should never be true
          if (relationship?.type !== "parent-child") {
            return prev
          }
          next.childrenByParentId = {
            ...next.childrenByParentId,
            [relationship.parent]: [
              ...prev.childrenByParentId[relationship.parent] || [],
              newPerson.id
            ]
          }
          next.parentsByChildId = {
            ...next.parentsByChildId,
            [newPerson.id]: [
              relationship.parent
            ]
          }
          break
        }
      }
      return next;
    });
    if (!editorState.independent) {
      setRelationships(prev => {
        let newRelationship: RelationshipType;
        let next = [...prev]
        switch (editorState.relationshipDraft.from) {
          case "child":
            let parents = people.parentsByChildId[editorState.relationshipDraft.connectingId] || []
            if (parents.length === 1) {
              next = next.filter(rel => rel.type !== "parent-child" || rel.parent !== parents[0] || rel.child !== editorState.relationshipDraft.connectingId)
              newRelationship = {
                type: "partner-partner",
                id: uuid(),
                firstPartner: parents[0],
                secondPartner: newPerson.id,
                children: [editorState.relationshipDraft.connectingId]
              }
            } else {
              newRelationship = {
                type: "parent-child",
                id: uuid(),
                parent: newPerson.id,
                child: editorState.relationshipDraft.connectingId
              }
            }
            break
          case "partner":
            newRelationship = {
              type: "partner-partner",
              id: uuid(),
              firstPartner: editorState.relationshipDraft.connectingId,
              secondPartner: newPerson.id,
              children: []
            }
            break
          case "parent":
            newRelationship = {
              type: "parent-child",
              id: uuid(),
              parent: editorState.relationshipDraft.connectingId,
              child: newPerson.id
            }
            break
          case "couple": {
            const relationship = next.find(rel => rel.id === editorState.relationshipDraft.connectingId)
            // This condition should never be true
            if (relationship?.type !== "partner-partner") return prev
            next = next.filter(rel => rel.id !== editorState.relationshipDraft.connectingId)
            newRelationship = {
              ...relationship,
              id: uuid(),
              children: [...relationship.children, newPerson.id]
            }
            break
          }
          case "parent-child": {
            const relationship = next.find(rel => rel.id === editorState.relationshipDraft.connectingId)
            // This condition should never be true
            if (relationship?.type !== "parent-child") return prev
            newRelationship = {
              type: "parent-child",
              id: uuid(),
              parent: relationship.parent,
              child: newPerson.id
            }
            break
          }
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
      {relationshipData.map(relationship => (
        <RelationshipPath 
          key={relationship.relationshipId}
          screenPositionX={screenPosition.x}
          screenPositionY={screenPosition.y}
          relationshipData={relationship}
          onClick={() => handleAddPersonFromRelationship(relationship)}
          disabled={editorState.state !== "dragging"}
        />
      ))}
      {editorState.state === "connecting" && (
        <PersonLocationChooser 
          relationshipDraftData={editorState.relationshipDraft}
          screenPositionX={screenPosition.x}
          screenPositionY={screenPosition.y}
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
          {!editorState.independent && (
            <RelationshipPathDraft
              relationshipData={editorState.relationshipDraft}
              screenPositionX={screenPosition.x}
              screenPositionY={screenPosition.y}
            />
          )}
          <PersonNamer 
            positionX={editorState.relationshipDraft.newPerson.positionX + screenPosition.x} 
            positionY={editorState.relationshipDraft.newPerson.positionY + screenPosition.y}
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
