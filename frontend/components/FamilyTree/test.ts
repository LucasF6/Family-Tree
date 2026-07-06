import { produce } from "immer"

export type RelationshipDraftBase = {

  from: "partner" | "child" | "parent" | "couple" | "parent-child" | "none"

  newPerson: string

}



export type RealRelationshipDraftData = RelationshipDraftBase & (

  | {

      from: "partner" // Connecting from person

      partner: string

    }

  | {

      from: "child" // Connecting from person

      child: string

    }

  | {

      from: "parent" // Connecting from person

      parent: string

    }

  | {

      from: "couple" // Connecting from partner-partner relationship

      firstPartner: string

      secondPartner: string

    }

  | {

      from: "parent-child" // Connecting from parent-child relationship

      parent: string

      child: string

    }

  )

export type IndependentDraftData = RelationshipDraftBase & {

  from: "none"

}



// connectingId is a person id if from is partner, child, or parent, and a relationship id otherwise

export type RealRelationshipDraft = RealRelationshipDraftData & {

  connectingId: string

}



export type RelationshipDraftData = RealRelationshipDraftData | IndependentDraftData



export type RelationshipDraft = RealRelationshipDraft | IndependentDraftData



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

      relationshipDraft: IndependentDraftData

    }

  | {

      state: "connecting"

      independent: false

      relationshipDraft: RealRelationshipDraft

      // connection: Exclude<Connection, "none"> // What the new person is to the person being connected

    }

  | {

      state: "naming"

      independent: true

      relationshipDraft: IndependentDraftData

    }

  | {

      state: "naming"

      independent: false

      relationshipDraft: RealRelationshipDraft

      relationshipOptionsOnRight: boolean

    }

  | {

      state: "disabled"

    }



function update(state: EditorState): EditorState {

  if (state.state !== "connecting") return state

  return produce(state, draft => {
    draft.relationshipDraft.newPerson = "hello"
  })

} 

