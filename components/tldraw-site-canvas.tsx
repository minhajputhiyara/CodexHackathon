"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Tldraw,
  createShapeId,
  useEditor,
  type Editor,
  type TLShape,
  type TLShapeId,
} from "tldraw";
import {
  WEBSITE_PAGE_SHAPE_TYPE,
  WebsitePageCanvasContext,
  WebsitePageShapeUtil,
  type WebsitePageShape,
} from "@/components/website-page-shape";
import type { PageFrame, WebsiteProject } from "@/lib/website-project-schema";

const pageShapeUtils = [WebsitePageShapeUtil];

type TldrawSiteCanvasProps = {
  project: WebsiteProject;
  selectedPageId: string | null;
  selectedElementId: string | null;
  onSelectPage: (pageId: string) => void;
  onSelectElement: (pageId: string, elementId: string) => void;
  onFrameChange: (pageId: string, frame: Partial<PageFrame>) => void;
};

function shapeIdForPage(pageId: string) {
  return createShapeId(`website-page-${pageId}`);
}

function isWebsitePageShape(shape: TLShape): shape is WebsitePageShape {
  return shape.type === WEBSITE_PAGE_SHAPE_TYPE;
}

function ProjectShapeSync({
  project,
  selectedPageId,
  onFrameChange,
}: {
  project: WebsiteProject;
  selectedPageId: string | null;
  onFrameChange: (pageId: string, frame: Partial<PageFrame>) => void;
}) {
  const editor = useEditor();
  const projectRef = useRef(project);
  const onFrameChangeRef = useRef(onFrameChange);

  projectRef.current = project;
  onFrameChangeRef.current = onFrameChange;

  useEffect(() => {
    const desiredIds = new Set<TLShapeId>(
      project.pages.map((page) => shapeIdForPage(page.id)),
    );
    const currentPageShapes = editor
      .getCurrentPageShapes()
      .filter(isWebsitePageShape);
    const staleShapes = currentPageShapes.filter(
      (shape) => !desiredIds.has(shape.id),
    );

    if (staleShapes.length > 0) {
      editor.deleteShapes(staleShapes.map((shape) => shape.id));
    }

    const creates: Parameters<Editor["createShapes"]>[0] = [];
    const updates: Parameters<Editor["updateShapes"]>[0] = [];

    for (const page of project.pages) {
      const shapeId = shapeIdForPage(page.id);
      const existing = editor.getShape<WebsitePageShape>(shapeId);
      const partial = {
        id: shapeId,
        type: WEBSITE_PAGE_SHAPE_TYPE,
        x: page.frame.x,
        y: page.frame.y,
        props: {
          pageId: page.id,
          name: page.name,
          route: page.route,
          width: page.frame.width,
          height: page.frame.height,
        },
      };

      if (existing) {
        updates.push(partial);
      } else {
        creates.push(partial);
      }
    }

    if (creates.length > 0) {
      editor.createShapes(creates);
    }

    if (updates.length > 0) {
      editor.updateShapes(updates);
    }

    if (selectedPageId) {
      const selectedShapeId = shapeIdForPage(selectedPageId);

      if (editor.getShape(selectedShapeId)) {
        editor.setSelectedShapes([selectedShapeId]);
      }
    }

  }, [editor, project, selectedPageId]);

  useEffect(() => {
    return editor.store.listen(
      () => {
        const currentProject = projectRef.current;

        for (const shape of editor
          .getCurrentPageShapes()
          .filter(isWebsitePageShape)) {
          const page = currentProject.pages.find(
            (candidate) => candidate.id === shape.props.pageId,
          );

          if (!page) {
            continue;
          }

          if (
            Math.abs(page.frame.x - shape.x) > 0.5 ||
            Math.abs(page.frame.y - shape.y) > 0.5
          ) {
            onFrameChangeRef.current(page.id, {
              x: shape.x,
              y: shape.y,
            });
          }
        }
      },
      { source: "user", scope: "document" },
    );
  }, [editor]);

  return null;
}

export function TldrawSiteCanvas({
  project,
  selectedPageId,
  selectedElementId,
  onSelectPage,
  onSelectElement,
  onFrameChange,
}: TldrawSiteCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const pageIdsKey = project.pages.map((page) => page.id).join("|");
  const contextValue = useMemo(
    () => ({
      project,
      selectedPageId,
      selectedElementId,
      onSelectPage,
      onSelectElement,
    }),
    [project, selectedElementId, selectedPageId, onSelectElement, onSelectPage],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    window.requestAnimationFrame(() => {
      editor.zoomToFit({ animation: { duration: 220 } });
    });
  }, [editor, pageIdsKey]);

  return (
    <WebsitePageCanvasContext.Provider value={contextValue}>
      <section className="relative h-[760px] overflow-hidden rounded-md border border-slate-200 bg-white">
        <Tldraw hideUi onMount={setEditor} shapeUtils={pageShapeUtils}>
          <ProjectShapeSync
            onFrameChange={onFrameChange}
            project={project}
            selectedPageId={selectedPageId}
          />
        </Tldraw>
        <div className="pointer-events-none absolute left-4 top-4 flex gap-2">
          <button
            className="pointer-events-auto rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => editor?.zoomToFit({ animation: { duration: 220 } })}
            type="button"
          >
            Fit pages
          </button>
          {selectedPageId ? (
            <span className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 shadow-sm">
              {project.pages.find((page) => page.id === selectedPageId)?.name}
            </span>
          ) : null}
        </div>
      </section>
    </WebsitePageCanvasContext.Provider>
  );
}
