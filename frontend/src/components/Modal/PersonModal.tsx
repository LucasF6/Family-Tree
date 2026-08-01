import { ChangeEvent, useEffect, useState } from "react"
import { Modal } from "./Modal"
import { useEditorState, useEditorStateDispatch } from "@/components/FamilyTree"

export function PersonModal() {
  // const [isOpen, setIsOpen] = useState(false)
  const { mode, graph: { peopleById: byId } } = useEditorState()
  const dispatch = useEditorStateDispatch()
  const [name, setName]= useState("")

  const isOpen = mode.type === "person-settings"

  // useEffect(() => {
  //   if (mode.type === "person-settings") {
  //     setIsOpen(true)
  //     setName(byId[mode.person].name)
  //     console.log("opened!!!")
  //   } else {
  //     setIsOpen(false)
  //   }
  // }, [mode.type])

  function handleClose() {
    setName("")
    dispatch({
      type: "CANCELED"
    })
  }

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
  }

  function handleSubmit() {
    dispatch({
      type: "EDITED_PERSON",
      name
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {isOpen && (
        <>
          <span>
            Name:
          </span>
          <input 
            className="m-2 border-2"
            placeholder={byId[mode.person].name}
            value={name}
            onChange={handleNameChange}
          />
          <button 
            className="bg-green-500 hover:bg-green-400 rounded-xl p-1.5"
            onClick={handleSubmit}
          >
            change
          </button>
        </>
      )}
    </Modal>
  )
}

