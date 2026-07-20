import { PersonData, PersonId, Position } from "@/types/family-tree.types";
import styles from "./OptionsBubble.module.css"

type OptionsBubbleProps = {
  person: PersonData
  onConnect: (id: PersonId) => void;
  onEdit: (id: PersonId) => void;
  onPage: (id: PersonId) => void;
};

export default function OptionsBubble({ person, onConnect, onEdit, onPage }: OptionsBubbleProps) {
  return (
    <div 
      className={styles['options-bubble']}
      style={{
        "--x": `${person.position.x}px`,
        "--y": `${person.position.y}px`,
      } as React.CSSProperties}
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="grid grid-cols-2">
        <button 
          className="bg-amber-400 hover:cursor-pointer hover:bg-amber-500 text-4xl font-mono"
          onClick={() => onEdit(person.id)}
        >
          Edit
        </button>
        <button 
          className="bg-blue-400 hover:cursor-pointer hover:bg-blue-500 text-4xl font-mono"
          onClick={() => onPage(person.id)}
        >
          Page
        </button>
      </div>
      <button 
        className="bg-green-400 hover:cursor-pointer hover:bg-green-500 text-4xl font-mono"
        onClick={() => onConnect(person.id)}
      >
        Connect
      </button>
    </div>
  )
}