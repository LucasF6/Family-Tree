import { useEffect, useRef } from "react"
import styles from "./Modal.module.css"

type ModalProps = {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
}

export function Modal({ children, isOpen, onClose }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

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

  function handleClose() {
    if (ref.current) {
      ref.current.close()
    }
  }

  return (
    <dialog
      className={styles.modal} 
      onClose={onClose}
      ref={ref}
    >
      <div className="flex flex-row-reverse">
        <button 
          className="text-red-500 bg-gray-300 hover:bg-red-300 text-2xl h-8 w-8 cursor-pointer rounded-lg"
          onClick={handleClose}
        >
          ×
        </button>
      </div>
      <div className="p-1.25">
        {children}
      </div>
    </dialog>
  )
}