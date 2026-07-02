import clsx from "clsx"

type AddPersonButtonProps = {
  disabled: boolean;
  onClick: (mouseX: number, mouseY: number) => void;
}

export default function AddPersonButton({ disabled, onClick }: AddPersonButtonProps) {
  return (
    <button
      className={clsx(
        "absolute left-5 bottom-5 bg-green-400 hover:bg-green-500 rounded-3xl w-20 h-20 border-green-800 border-4 text-6xl text-green-950 select-none",
        disabled && "bg-gray-500"
      )}
      onClick={e => onClick(e.clientX, e.clientY)}
      onPointerDown={e => e.stopPropagation()}
    >
      +
    </button>
  )
}