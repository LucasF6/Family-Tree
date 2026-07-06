
'use client'

import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  return (
    <button 
      className="border-4 border-blue-900 bg-blue-600 self-center m-3 w-fit h-fit p-4 font-mono rounded-3xl hover:bg-blue-800 relative top-40"
      onClick={() => router.push("/tree")}
    >
      <div className="text-center text-7xl">
        Begin Family Tree
      </div>
    </button>
  )
}