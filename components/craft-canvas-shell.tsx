"use client";

import { Editor, Frame, Element } from "@craftjs/core";
import { CraftCanvasPlaceholder } from "@/components/craft-canvas-placeholder";

export function CraftCanvasShell() {
  return (
    <Editor resolver={{ CraftCanvasPlaceholder }}>
      <Frame>
        <Element is={CraftCanvasPlaceholder} canvas />
      </Frame>
    </Editor>
  );
}
