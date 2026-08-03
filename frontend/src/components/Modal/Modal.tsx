import { SyntheticEvent, useEffect, useRef } from "react"
import styles from "./Modal.module.css"

type ModalProps = {
  children: React.ReactNode
  title: string
  isOpen: boolean
  style?: React.CSSProperties
  onClose: (e: SyntheticEvent<HTMLDialogElement>) => void
}

export function Modal({ children, title, isOpen, style, onClose }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  style ??= {
    width: "min(90vw, 600px)",
    maxHeight: "90vh",
    minHeight: "30vh"
  }

  useEffect(() => {
    if (!ref.current) {
      return
    }
    if (isOpen && !ref.current.open) {
      ref.current.showModal()
    } else if (!isOpen && ref.current.open) {
      ref.current.close()
    }
  }, [isOpen])

  function handleClickX() {
    if (ref.current) {
      ref.current.close()
    }
  }

  return (
    <dialog
      className={styles.modal} 
      style={style}
      onClose={onClose}
      ref={ref}
    >
      <div className="flex flex-col">
        <div className="flex flex-row items-center h-9.25 bg-gray-300 border-b-px">
          <span className="text-center ml-2 text-2xl text-nowrap">{title}</span>
          <button 
            className="bg-gray-400 hover:bg-red-300 text-2xl h-8 w-8 m-0.75 top-0 right-0 cursor-pointer rounded-lg absolute"
            onClick={handleClickX}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-2.5">
          {children}
        </div>
      </div>
    </dialog>
  )
}