import { ChangeEvent, useEffect, useState } from "react"
import { Modal } from "./Modal"
import { useEditorState, useEditorStateDispatch } from "@/components/FamilyTree"
import { EditorAction } from "@/types/family-tree.types"

type Image = {
  url: string
  file: File
}

export function PersonModal() {
  const { mode, graph: { peopleById: byId } } = useEditorState()
  const dispatch = useEditorStateDispatch()
  const [name, setName]= useState("")
  const [image, setImage] = useState<Image | null>(null)

  const isOpen = mode.type === "person-settings"

  function reset() {
    setName("")
    if (image !== null) {
      // URL.revokeObjectURL(image.url)
      setImage(null)
    }
  }

  function handleClose() {
    reset()
    if (isOpen) {
      // This occurs when modal was x'd or esc'd
      dispatch({
        type: "CANCELED"
      })
    } else {
      // This occurs during a submit
      
    }
  }

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
  }
  
  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    const url = URL.createObjectURL(file)
    setImage({
      file,
      url
    })
  }

  function handleSubmit() {
    let action: Extract<EditorAction, { type: "EDITED_PERSON" }> = { type: "EDITED_PERSON" }
    if (name !== "") {
      action.name = name
    }
    if (image !== null) {
      action.image = image
    }
    dispatch(action)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {isOpen && (
        <div className="flex flex-col">
          <div>
            <span>
              Name:
            </span>
            <input 
              className="m-2 border-2"
              placeholder={byId[mode.person].name}
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div>
            <span>Image: </span>
            <input 
              className="file:m-2 file:border-2 file:px-1.5 file:py-0.5 file:cursor-pointer"
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
            />
          </div>
          <div>
            {image && (
              <img 
                className="rounded-full w-16 h-16"
                src={image.url} 
              />
            )}
          </div>
          <div>
            <button 
              className="bg-green-500 hover:bg-green-400 rounded-xl p-1.5 cursor-pointer"
              onClick={handleSubmit}
            >
              submit
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

