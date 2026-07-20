import { AddPersonButton } from "./AddPersonButton";
import { FamilyTreeMode } from "@/types/family-tree.types"

type OverlayProps = {
  disabled: boolean;
  onAddPerson: () => void;
  helpText: FamilyTreeMode // What help text appears on the bottom right depends on the mode
}

const helpTextByMode: Record<string, string> = {
  dragging: "Hit c to create",
  connecting: "Hit esc to go back",
  naming: "Hit esc to go back\nHit enter to submit",
  options: "Hit esc to go back\nHit c to create",
  disabled: "",
  "choosing-connection": ""
}

export default function Overlay({ disabled, onAddPerson, helpText }: OverlayProps) {
  return (
    <>
      <AddPersonButton 
        disabled={disabled}
        onClick={onAddPerson}
      />
      <span className="absolute right-2 bottom-2 text-right font-mono text-xl text-white whitespace-pre-wrap select-none pointer-events-none">
        {helpTextByMode[helpText]}
      </span>
    </>
  )
}