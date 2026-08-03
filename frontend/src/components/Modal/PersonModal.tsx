import { ChangeEvent, useEffect, useState } from "react"
import { Modal } from "./Modal"
import { useEditorState, useEditorStateDispatch } from "@/components/FamilyTree"
import { EditorAction } from "@/types/family-tree.types"
import Cropper, { Point } from "react-easy-crop"
import { CropperModal } from "./CropperModal"

type Image = {
  url: string
  blob: Blob
}

export function PersonModal() {
  const { mode, graph: { peopleById: byId } } = useEditorState()
  const dispatch = useEditorStateDispatch()
  const [name, setName]= useState("")
  const [image, setImage] = useState<Image | null>(null)
  const [precroppedImageURL, setPrecroppedImageURL] = useState<string | null>(null)

  const isOpen = mode.type === "person-settings"

  function reset() {
    setName("")
    setImage(null)
  }

  function handleClose() {
    reset()
    if (isOpen) {
      // This occurs when modal was x'd or esc'd
      if (image) {
        URL.revokeObjectURL(image.url)
      }
      dispatch({
        type: "CANCELED"
      })
    }
  }

  function handleCloseCropper() {
    if (!precroppedImageURL) {
      return
    }
    URL.revokeObjectURL(precroppedImageURL)
    setPrecroppedImageURL(null)
  }

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
  }
  
  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    setPrecroppedImageURL(URL.createObjectURL(file))
  }

  function handleDone(blob: Blob) {
    if (image) {
      URL.revokeObjectURL(image.url)
    }
    setImage({
      blob,
      url: URL.createObjectURL(blob)
    })
    setPrecroppedImageURL(null)
  }

  function handleSubmit() {
    if (!isOpen) {
      return
    }
    let action: Extract<EditorAction, { type: "EDITED_PERSON" }> = { type: "EDITED_PERSON" }
    if (name !== "") {
      action.name = name
    }
    if (image !== null) {
      const person = byId[mode.person]
      if (person.imageBlob && person.imageURL) {
        URL.revokeObjectURL(person.imageURL)
      }
      action.image = image
    }
    dispatch(action)
  }

  return (
    <Modal title={`Edit ${isOpen && byId[mode.person].name}`} isOpen={isOpen} onClose={handleClose}>
      {isOpen && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <span className="mr-2">
              Name:
            </span>
            <input 
              className="border-2 px-1.5"
              placeholder={byId[mode.person].name}
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div className="flex items-center">
            <span className="mr-2">Image: </span>
            <input 
              className="hidden"
              id="file-input"
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
            />
            <label htmlFor="file-input" className="border-2 bg-gray-400 px-1.5 cursor-pointer self-center">
              Choose file
            </label>
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
          <CropperModal src={precroppedImageURL} onDone={handleDone} onClose={handleCloseCropper} />
        </div>
      )}
    </Modal>
  )
}
