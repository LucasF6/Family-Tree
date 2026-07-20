'use client'

import clsx from "clsx";
import { getChildToCouplePath, getChildToParentPath, getPartnerToPartnerPath } from "@/components/Relationships/paths";
import { RelationshipDraftData } from "@/types/family-tree.types";

type RelationshipPathDraftProps = {
  relationshipDraftData: RelationshipDraftData
}

export function RelationshipPathDraft({ relationshipDraftData }: RelationshipPathDraftProps) {
  let pathData: string;
  switch (relationshipDraftData.type) {
    case "parent": {
      const { personConnecting, newPerson } = relationshipDraftData
      pathData = getChildToParentPath(personConnecting, newPerson)
      break
    }
    case "partner": {
      const { personConnecting, newPerson } = relationshipDraftData
      const swapPartners = personConnecting.position.x > newPerson.position.x
      pathData = getPartnerToPartnerPath(swapPartners ? newPerson : personConnecting, swapPartners ? personConnecting : newPerson)
      break
    }
    case "child": {
      const { personConnecting, newPerson } = relationshipDraftData
      pathData = getChildToParentPath(newPerson, personConnecting)
      break
    }
    case "couple-child": {
      const { newPerson, firstPartner, secondPartner } = relationshipDraftData
      pathData = getChildToCouplePath(newPerson, firstPartner, secondPartner)
      break
    }
  }

  return (
    <svg
      className="absolute inset-0 overflow-visible"
    >
      <path
        className={clsx("stroke-white")}
        strokeWidth="2"
        fill="none"
        d={pathData}
      />
    </svg>
  );
}