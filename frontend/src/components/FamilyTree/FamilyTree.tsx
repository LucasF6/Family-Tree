'use client'

import { Relationships } from "@/components/Relationships";
import Overlay from "@/components/Overlay";
import Canvas from "@/components/Canvas";
import People from "@/components/People";
import OptionsBubble from "@/components/OptionsBubble";
import { EditorStateProvider } from "./EditorStateProvider";

export default function FamilyTree() {
  return (
    <EditorStateProvider>
      <Canvas
        disabled={false}
        overlay={<Overlay />}
      >
        <Relationships />
        <OptionsBubble />
        <People />
      </Canvas>
    </EditorStateProvider>
  );
}
