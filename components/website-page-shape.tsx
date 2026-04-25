"use client";

import { createContext, useContext } from "react";
import {
  HTMLContainer,
  type RecordProps,
  Rectangle2d,
  ShapeUtil,
  T,
  type TLShape,
} from "tldraw";
import { CanvasRenderer } from "@/components/canvas-renderer";
import { findPageById } from "@/lib/website-project";
import type { WebsiteProject } from "@/lib/website-project-schema";

const HEADER_HEIGHT = 56;
export const WEBSITE_PAGE_SHAPE_TYPE = "website-page" as const;

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
  onSelectPage: (pageId: string) => void;
  onSelectElement: (pageId: string, elementId: string) => void;
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

function WebsitePageShapeView({ shape }: { shape: WebsitePageShape }) {
  const {
    project,
    selectedElementId,
    selectedPageId,
    onSelectElement,
    onSelectPage,
  } = useWebsitePageCanvas();
  const page = findPageById(project, shape.props.pageId);
  const isSelected = selectedPageId === shape.props.pageId;

  if (!page) {
    return null;
  }

  return (
    <HTMLContainer
      className="overflow-hidden rounded-md bg-white shadow-lg"
      style={{
        width: shape.props.width,
        height: shape.props.height + HEADER_HEIGHT,
        pointerEvents: "all",
      }}
    >
      <div
        className={`flex h-14 items-center justify-between border-b px-5 ${
          isSelected
            ? "border-teal-600 bg-teal-50"
            : "border-slate-200 bg-slate-50"
        }`}
        onPointerDown={() => onSelectPage(page.id)}
      >
        <div>
          <p className="text-sm font-bold text-slate-950">{page.name}</p>
          <p className="text-xs text-slate-500">{page.route}</p>
        </div>
        <span className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600">
          {shape.props.width} x {shape.props.height}
        </span>
      </div>
      <div
        className="h-[1200px] overflow-hidden bg-white"
        onClick={() => onSelectPage(page.id)}
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          width: shape.props.width,
          height: shape.props.height,
        }}
      >
        <CanvasRenderer
          node={page.tree}
          onSelect={(elementId) => onSelectElement(page.id, elementId)}
          selectedId={isSelected ? selectedElementId : null}
        />
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
      width: 1440,
      height: 1200,
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
      height: shape.props.height + HEADER_HEIGHT,
      isFilled: true,
    });
  }

  component(shape: WebsitePageShape) {
    return <WebsitePageShapeView shape={shape} />;
  }

  indicator(shape: WebsitePageShape) {
    return (
      <rect
        height={shape.props.height + HEADER_HEIGHT}
        width={shape.props.width}
      />
    );
  }
}
