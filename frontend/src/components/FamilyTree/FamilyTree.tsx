'use client'

import { Relationships } from "@/components/Relationships";
import Overlay from "@/components/Overlay";
import Canvas from "@/components/Canvas";
import OptionsBubble from "@/components/OptionsBubble";
import { EditorStateProvider } from "./EditorStateProvider";
import { PeopleWithDraft } from "../PeopleWithDraft/PeopleWithDraft";
import KeyboardShortcuts from "../KeyboardShortcuts";
import { PersonModal } from "@/components/Modal";

export default function FamilyTree() {
  return (
    <EditorStateProvider>
      <Canvas
        disabled={false}
        overlay={<Overlay />}
        keyboardShortcuts={<KeyboardShortcuts />}
      >
        <Relationships />
        <PeopleWithDraft />
        <OptionsBubble />
      </Canvas>
      <PersonModal />
    </EditorStateProvider>
  );
}
