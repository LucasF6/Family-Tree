import Cropper, { Area, Point } from "react-easy-crop"
import { Modal } from "./Modal"
import { ChangeEvent, SyntheticEvent, useState } from "react"

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const { width: bBoxWidth, height: bBoxHeight } = image

  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')!

  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise<Blob | null>((resolve) => {
    croppedCanvas.toBlob(blob => blob ? resolve(blob) : null, 'image/jpeg')
  })
}


type CropperModalProps = {
  src: string | null
  onDone: (blob: Blob) => void
  onClose: () => void
}

export function CropperModal({ src, onDone, onClose }: CropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [slider, setSlider] = useState<number>(0)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  const zoom = Math.exp(slider / 100)

  function handleClose(e: SyntheticEvent<HTMLDialogElement>) {
    e.stopPropagation()
    onClose()
  }

  function handleZoomChange(e: ChangeEvent<HTMLInputElement>) {
    setSlider(+e.target.value)
  }

  function handleCropComplete(_: Area, croppedArea: Area) {
    setCroppedArea(croppedArea)
  }

  async function handleDone() {
    if (!src || !croppedArea) {
      return
    }

    const out: Blob | null = await getCroppedImg(src, croppedArea)
    if (out) {
      onDone(out)
    } else {
      throw new Error("a problem happened and the file came back null")
    }
  }
  
  return (
    <Modal 
      title="Crop Person"
      isOpen={!!src} 
      onClose={handleClose}
      style={{
        width: "min(60vw, 400px)",
        maxHeight: "90vh",
        minHeight: "45vh"
      }}
    >
      <div className="flex flex-col items-center w-full gap-2">
        <Cropper 
          image={src ?? undefined}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={handleCropComplete}
          zoomWithScroll={false}
          style={{
            containerStyle: {
              position: "relative",
              width: "224px",
              height: "224px"
            }
          }}
        />
        <input className="w-56.5" type="range" value={slider} onChange={handleZoomChange} />
        <button 
          className="bg-green-500 hover:bg-green-400 rounded-xl p-1.5 cursor-pointer"
          onClick={handleDone}
        >
          done
        </button>

      </div>
    </Modal>
  )
}
