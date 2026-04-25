"use client";

import {
  createContext,
  useEffect,
  useContext,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  HTMLContainer,
  type RecordProps,
  Rectangle2d,
  ShapeUtil,
  T,
  type TLShape,
  useEditor,
} from "tldraw";
import { CanvasRenderer } from "@/components/canvas-renderer";
import { findPageById } from "@/lib/website-project";
import type { WebsiteProject } from "@/lib/website-project-schema";

const HEADER_HEIGHT = 56;
const VIEWPORT_GAP = 24;
const VIEWPORT_LABEL_HEIGHT = 36;
const VIEWPORT_PADDING = 24;
export const WEBSITE_PAGE_SHAPE_TYPE = "website-page" as const;

export const pageViewportPreviews = [
  {
    key: "desktop",
    label: "Desktop",
    width: 1440,
    height: 900,
  },
  {
    key: "tablet",
    label: "Tablet",
    width: 768,
    height: 1024,
  },
  {
    key: "mobile",
    label: "Mobile",
    width: 390,
    height: 844,
  },
] as const;

export const PAGE_VIEWPORT_GROUP_WIDTH =
  pageViewportPreviews.reduce((total, viewport) => total + viewport.width, 0) +
  VIEWPORT_GAP * (pageViewportPreviews.length - 1) +
  VIEWPORT_PADDING * 2;

export const PAGE_VIEWPORT_GROUP_HEIGHT =
  HEADER_HEIGHT +
  VIEWPORT_LABEL_HEIGHT +
  Math.max(...pageViewportPreviews.map((viewport) => viewport.height)) +
  VIEWPORT_PADDING * 2;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [WEBSITE_PAGE_SHAPE_TYPE]: {
      pageId: string;
      name: string;
      route: string;
      width: number;
      height: number;
    };
  }
}

export type WebsitePageShape = TLShape<typeof WEBSITE_PAGE_SHAPE_TYPE>;

type WebsitePageShapeProps = {
  pageId: string;
  name: string;
  route: string;
  width: number;
  height: number;
};

type WebsitePageCanvasContextValue = {
  project: WebsiteProject;
  selectedPageId: string | null;
  selectedElementId: string | null;
  hoveredElementId: string | null;
  movablePageId: string | null;
  onSelectPage: (pageId: string) => void;
  onSelectElement: (pageId: string, elementId: string) => void;
  onHoverElement: (elementId: string | null) => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onTogglePageMove: (pageId: string) => void;
};

export const WebsitePageCanvasContext =
  createContext<WebsitePageCanvasContextValue | null>(null);

function useWebsitePageCanvas() {
  const value = useContext(WebsitePageCanvasContext);

  if (!value) {
    throw new Error("WebsitePageCanvasContext is missing.");
  }

  return value;
}

function useCanvasZoom() {
  const editor = useEditor();
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const updateZoom = () => setZoom(editor.getZoomLevel());

    updateZoom();
    return editor.store.listen(updateZoom, { source: "all", scope: "session" });
  }, [editor]);

  return Math.max(zoom, 0.01);
}

function SelectionToolbar({
  label,
  pageId,
  shapeId,
}: {
  label: string;
  pageId: string;
  shapeId: WebsitePageShape["id"];
}) {
  const {
    movablePageId,
    project,
    onDeletePage,
    onDuplicatePage,
    onTogglePageMove,
  } = useWebsitePageCanvas();
  const editor = useEditor();
  const zoom = useCanvasZoom();
  const inverseZoom = 1 / zoom;
  const stopToolbarEvent = (event: PointerEvent | MouseEvent) => {
    event.stopPropagation();
  };
  const canDeletePage = project.pages.length > 1;
  const isMoveEnabled = movablePageId === pageId;

  const toggleFrameMove = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    editor.setCurrentTool("select");
    editor.setSelectedShapes([shapeId]);
    onTogglePageMove(pageId);
  };

  return (
    <div
      className="absolute left-1/2 z-20"
      onClick={stopToolbarEvent}
      onPointerDown={stopToolbarEvent}
      style={{
        bottom: `calc(100% + ${12 / zoom}px)`,
        transform: "translateX(-50%)",
      }}
    >
      <div
        className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#111114]/95 px-2 py-2 text-white shadow-2xl shadow-black/40 backdrop-blur"
        style={{
          transform: `scale(${inverseZoom})`,
          transformOrigin: "bottom center",
        }}
      >
        <span className="mr-1 max-w-40 truncate rounded-md bg-[#5b5cf6] px-2 py-1 text-xs font-semibold">
          {label}
        </span>
        <button
          aria-pressed={isMoveEnabled}
          aria-label="Move page"
          className={`rounded-md p-1.5 transition ${
            isMoveEnabled
              ? "bg-[#5b5cf6] text-white"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
          onPointerDown={toggleFrameMove}
          title={isMoveEnabled ? "Move mode enabled" : "Enable frame move"}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v18M3 12h18M7 7l-4 5 4 5M17 7l4 5-4 5M7 7l5-4 5 4M7 17l5 4 5-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
        <button
          aria-label="Duplicate page"
          className="rounded-md p-1.5 text-gray-300 transition hover:bg-white/10 hover:text-white"
          onClick={(event) => {
            event.stopPropagation();
            onDuplicatePage(pageId);
          }}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M8 8h10v10H8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
        <button
          aria-label="Delete page"
          className="rounded-md p-1.5 text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canDeletePage}
          onClick={(event) => {
            event.stopPropagation();
            onDeletePage(pageId);
          }}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function WebsitePageShapeView({ shape }: { shape: WebsitePageShape }) {
  const {
    project,
    hoveredElementId,
    selectedElementId,
    selectedPageId,
    movablePageId,
    onHoverElement,
    onSelectElement,
    onSelectPage,
  } = useWebsitePageCanvas();
  const editor = useEditor();
  const page = findPageById(project, shape.props.pageId);
  const isSelected = selectedPageId === shape.props.pageId;
  const isMoveEnabled = movablePageId === shape.props.pageId;

  if (!page) {
    return null;
  }

  return (
    <HTMLContainer
      className="overflow-visible"
      style={{
        width: shape.props.width,
        height: shape.props.height,
        pointerEvents: "all",
      }}
    >
      <div className="relative">
        {isSelected ? (
          <SelectionToolbar
            label={page.name}
            pageId={page.id}
            shapeId={shape.id}
          />
        ) : null}
        <div
          className={`relative overflow-hidden rounded-md bg-white shadow-lg ${
            isSelected ? "ring-2 ring-[#5b5cf6]" : ""
          } ${isMoveEnabled ? "cursor-move" : ""}`}
        >
          {isMoveEnabled ? (
            <div
              aria-label={`Move ${page.name} frame`}
              className="absolute inset-0 z-10 cursor-move"
              onPointerDown={(event) => {
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                editor.setCurrentTool("select");
                editor.setSelectedShapes([shape.id]);
                onSelectPage(page.id);
                editor.dispatch({
                  type: "pointer",
                  target: "shape",
                  shape,
                  name: "pointer_down",
                  point: { x: event.clientX, y: event.clientY },
                  pointerId: event.pointerId,
                  button: event.button,
                  isPen: event.pointerType === "pen",
                  shiftKey: event.shiftKey,
                  altKey: event.altKey,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                  accelKey: event.metaKey || event.ctrlKey,
                });
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                editor.dispatch({
                  type: "pointer",
                  target: "shape",
                  shape,
                  name: "pointer_up",
                  point: { x: event.clientX, y: event.clientY },
                  pointerId: event.pointerId,
                  button: event.button,
                  isPen: event.pointerType === "pen",
                  shiftKey: event.shiftKey,
                  altKey: event.altKey,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                  accelKey: event.metaKey || event.ctrlKey,
                });
              }}
              role="button"
              tabIndex={-1}
            />
          ) : null}
          <div
            className={`flex h-14 items-center justify-between border-b px-5 ${
              isSelected
                ? "border-[#5b5cf6] bg-[#f3f2ff]"
                : "border-slate-200 bg-slate-50"
            }`}
            onPointerDown={() => onSelectPage(page.id)}
          >
            <div>
              <p className="text-sm font-bold text-slate-950">{page.name}</p>
              <p className="text-xs text-slate-500">{page.route}</p>
            </div>
            <span className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600">
              3 responsive previews
            </span>
          </div>
          <div className="bg-slate-100 p-6">
            <div
              className="flex items-start"
              style={{
                gap: VIEWPORT_GAP,
                width: PAGE_VIEWPORT_GROUP_WIDTH - VIEWPORT_PADDING * 2,
              }}
            >
              {pageViewportPreviews.map((viewport) => (
                <div className="shrink-0" key={viewport.key}>
                  <div className="mb-3 flex h-6 items-center justify-between">
                    <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                      {viewport.label}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {viewport.width} x {viewport.height}
                    </span>
                  </div>
                  <div
                    className="overflow-auto overscroll-contain rounded-md border border-slate-300 bg-white shadow-sm"
                    onClick={() => onSelectPage(page.id)}
                    onPointerDown={(event) => {
                      if (!isMoveEnabled) {
                        event.stopPropagation();
                      }
                    }}
                    onWheel={(event) => {
                      if (!isMoveEnabled) {
                        event.stopPropagation();
                      }
                    }}
                    style={{
                      width: viewport.width,
                      height: viewport.height,
                    }}
                  >
                    <CanvasRenderer
                      hoveredId={isSelected && !isMoveEnabled ? hoveredElementId : null}
                      node={page.tree}
                      onHover={(elementId) => {
                        if (!isMoveEnabled) {
                          onHoverElement(elementId);
                        }
                      }}
                      onSelect={(elementId) => {
                        if (!isMoveEnabled) {
                          onSelectElement(page.id, elementId);
                        }
                      }}
                      selectedId={isSelected && !isMoveEnabled ? selectedElementId : null}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </HTMLContainer>
  );
}

export class WebsitePageShapeUtil extends ShapeUtil<WebsitePageShape> {
  static override type = WEBSITE_PAGE_SHAPE_TYPE;

  static override props: RecordProps<WebsitePageShape> = {
    pageId: T.string,
    name: T.string,
    route: T.string,
    width: T.number,
    height: T.number,
  };

  getDefaultProps(): WebsitePageShapeProps {
    return {
      pageId: "page",
      name: "Page",
      route: "/",
      width: PAGE_VIEWPORT_GROUP_WIDTH,
      height: PAGE_VIEWPORT_GROUP_HEIGHT,
    };
  }

  override canEdit() {
    return false;
  }

  override canResize() {
    return false;
  }

  override canScroll() {
    return true;
  }

  getGeometry(shape: WebsitePageShape) {
    return new Rectangle2d({
      width: shape.props.width,
      height: shape.props.height,
      isFilled: true,
    });
  }

  component(shape: WebsitePageShape) {
    return <WebsitePageShapeView shape={shape} />;
  }

  indicator(shape: WebsitePageShape) {
    return (
      <rect
        height={shape.props.height}
        width={shape.props.width}
      />
    );
  }
}
