import { PersonCardData } from "@/types"

const personHeight = 60

export function getAveragePositionBetweenPartners(firstPartner: PersonCardData, secondPartner: PersonCardData) {
  let positionX = 0.5 * (firstPartner.positionX + firstPartner.width / 2 + secondPartner.positionX - secondPartner.width / 2)
  let positionY = 0.5 * (firstPartner.positionY + secondPartner.positionY)
  return [positionX, positionY]
}

export function getChildToPositionPath(child: PersonCardData, positionX: number, positionY: number) {
  return (
    `
      M ${positionX} ${positionY}
      C ${positionX} ${positionY + 50},
        ${child.positionX} ${child.positionY - personHeight / 2 - 50},
        ${child.positionX} ${child.positionY - personHeight / 2}
    `
  )
}

export function getChildToParentPath(child: PersonCardData, parent: PersonCardData) {
  return (
    `
      M ${child.positionX} ${child.positionY - personHeight / 2}
      C ${child.positionX} ${child.positionY - personHeight / 2 - 50},
        ${parent.positionX} ${parent.positionY + personHeight / 2 + 50},
        ${parent.positionX} ${parent.positionY + personHeight / 2}
    `
  )
}

export function getPartnerToPartnerPath(firstPartner: PersonCardData, secondPartner: PersonCardData) {
  return (
    `
      M ${firstPartner.positionX + firstPartner.width / 2} ${firstPartner.positionY}
      C ${firstPartner.positionX + firstPartner.width / 2 + 50} ${firstPartner.positionY},
        ${secondPartner.positionX - secondPartner.width / 2 - 50} ${secondPartner.positionY},
        ${secondPartner.positionX - secondPartner.width / 2} ${secondPartner.positionY}
    `
  )
}
