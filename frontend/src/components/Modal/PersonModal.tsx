import { ChangeEvent, useEffect, useState } from "react"
import { Modal } from "./Modal"
import { useEditorState, useEditorStateDispatch } from "@/components/FamilyTree"

export function PersonModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { mode, graph: { peopleById: byId } } = useEditorState()
  const dispatch = useEditorStateDispatch()
  const [name, setName]= useState("")

  useEffect(() => {
    if (mode.type === "person-settings") {
      setIsOpen(true)
      setName(byId[mode.person].name)
      console.log("opened!!!")
    } else {
      setIsOpen(false)
    }
  }, [mode.type])

  function handleClose() {
    dispatch({
      type: "CANCELED"
    })
  }

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
  }

  function handleSubmit() {
    setIsOpen(false)
    dispatch({
      type: "EDITED_PERSON",
      name
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <span>
        Name:
      </span>
      <input 
        className="m-2 border-2"
        placeholder={name}
        onChange={handleNameChange}
      />
      <button 
        className="bg-green-500 hover:bg-green-400 rounded-xl p-1.5"
        onClick={handleSubmit}
      >
        change
      </button>
    </Modal>
  )
}

