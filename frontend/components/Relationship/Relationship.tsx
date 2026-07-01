'use client'

type RelationshipBaseProps = {
  screenPositionX: number;
  screenPositionY: number;
}

type RelationshipProps = 
  | RelationshipBaseProps & {
      type: "parent-child";
      parent: Person;
      child: Person;
    }
  | RelationshipBaseProps & {
      type: "partner-partner";
      firstPartner: Person;
      secondPartner: Person;
      children: Person[];
    }

type Person = {
  positionX: number;
  positionY: number;
  width: number;
}

const personHeight = 60;

export default function Relationship(props: RelationshipProps) {
  
  const { type, screenPositionX, screenPositionY } = props

  let pathData
  let childrenPathData : string[] = []
  switch (type) {
    case "parent-child":
      const { child, parent } = props
      pathData = 
        `
          M ${child.positionX} ${child.positionY - personHeight / 2}
          C ${child.positionX} ${child.positionY - personHeight / 2 - 50},
            ${parent.positionX} ${parent.positionY + personHeight / 2 + 50},
            ${parent.positionX} ${parent.positionY + personHeight / 2}
        `
      break
    case "partner-partner":
      let { firstPartner, secondPartner, children } = props
      if (firstPartner.positionX > secondPartner.positionX) {
        [firstPartner, secondPartner] = [secondPartner, firstPartner]
      }
      pathData = 
        `
          M ${firstPartner.positionX + firstPartner.width / 2} ${firstPartner.positionY}
          C ${firstPartner.positionX + firstPartner.width / 2 + 50} ${firstPartner.positionY},
            ${secondPartner.positionX - secondPartner.width / 2 - 50} ${secondPartner.positionY},
            ${secondPartner.positionX - secondPartner.width / 2} ${secondPartner.positionY}
        `
      let positionX = 0.5 * (firstPartner.positionX + firstPartner.width / 2 + secondPartner.positionX - secondPartner.width / 2)
      let positionY = 0.5 * (firstPartner.positionY + secondPartner.positionY)
      childrenPathData = children.map(child => (
        `
          M ${positionX} ${positionY}
          C ${positionX} ${positionY + 50},
            ${child.positionX} ${child.positionY - personHeight / 2 - 50},
            ${child.positionX} ${child.positionY - personHeight / 2}
        `
      ))
      break
  }

  return (
    <>
      <svg 
        className="absolute inset-0 overflow-visible"
        style={{
          transform: `translate(${screenPositionX}px, ${screenPositionY}px)`
        }}
      >
        <path stroke="white" strokeWidth="2" fill="none" d={pathData} />
        {type === "partner-partner" && childrenPathData.map((childPathData, index) => (
          <path key={index} stroke="white" strokeWidth="2" fill="none" d={childPathData} />
        ))}
      </svg>
    </>
  )
}