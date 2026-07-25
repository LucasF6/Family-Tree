'use client'

import { Relationships } from "@/components/Relationships";
import Overlay from "@/components/Overlay";
import Canvas from "@/components/Canvas";
import People from "@/components/People";
import OptionsBubble from "@/components/OptionsBubble";
import { EditorStateProvider } from "./EditorStateProvider";
import { PeopleWithDraft } from "../PeopleWithDraft/PeopleWithDraft";

export default function FamilyTree() {
  return (
    <EditorStateProvider>
      <Canvas
        disabled={false}
        overlay={<Overlay />}
      >
        <Relationships />
        <OptionsBubble />
        <PeopleWithDraft />
      </Canvas>
    </EditorStateProvider>
  );
}
