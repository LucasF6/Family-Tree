import { PersonSpatialData, Position } from "@/types/family-tree.types"

const personHeight = 60

export function getAveragePositionBetweenPartners(firstPartner: PersonSpatialData, secondPartner: PersonSpatialData): Position {
  let x = 0.5 * (firstPartner.position.x + firstPartner.width / 2 + secondPartner.position.x - secondPartner.width / 2)
  let y = 0.5 * (firstPartner.position.y + secondPartner.position.y)
  return { x, y }
}

export function getChildToPositionPath(child: PersonSpatialData, position: Position, strength: number = 50) {
  return (
    `
      M ${position.x} ${position.y}
      C ${position.x} ${position.y + strength},
        ${child.position.x} ${child.position.y - personHeight / 2 - strength},
        ${child.position.x} ${child.position.y - personHeight / 2}
    `
  )
}

export function getChildToParentPath(child: PersonSpatialData, parent: PersonSpatialData, strength: number = 50) {
  return (
    `
      M ${child.position.x} ${child.position.y - personHeight / 2}
      C ${child.position.x} ${child.position.y - personHeight / 2 - strength},
        ${parent.position.x} ${parent.position.y + personHeight / 2 + strength},
        ${parent.position.x} ${parent.position.y + personHeight / 2}
    `
  )
}

export function getPartnerToPartnerPath(firstPartner: PersonSpatialData, secondPartner: PersonSpatialData, strength: number = 50) {
  return (
    `
      M ${firstPartner.position.x + firstPartner.width / 2} ${firstPartner.position.y}
      C ${firstPartner.position.x + firstPartner.width / 2 + strength} ${firstPartner.position.y},
        ${secondPartner.position.x - secondPartner.width / 2 - strength} ${secondPartner.position.y},
        ${secondPartner.position.x - secondPartner.width / 2} ${secondPartner.position.y}
    `
  )
}

export function getChildToCouplePath(child: PersonSpatialData, firstPartner: PersonSpatialData, secondPartner: PersonSpatialData) {
  return getChildToPositionPath(
    child,
    getAveragePositionBetweenPartners(firstPartner, secondPartner)
  )
}
