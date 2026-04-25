import type { UIElementProps } from "@/lib/ui-schema";
import { assignMissingNodeIds, updateNodePropsById } from "@/lib/ui-tree";
import type {
  PageFrame,
  WebsitePage,
  WebsiteProject,
} from "@/lib/website-project-schema";

const FRAME_WIDTH = 2694;
const FRAME_HEIGHT = 1164;
const FRAME_GAP = 320;

function slugify(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

export function layoutFrames(pageCount: number): PageFrame[] {
  const columns = pageCount <= 2 ? pageCount : 2;

  return Array.from({ length: pageCount }, (_, index) => ({
    x: (index % columns) * (FRAME_WIDTH + FRAME_GAP),
    y: Math.floor(index / columns) * (FRAME_HEIGHT + FRAME_GAP),
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  }));
}

export function normalizeProject(project: WebsiteProject): WebsiteProject {
  const frames = layoutFrames(project.pages.length);
  const usedRoutes = new Set<string>();

  return {
    id: project.id || "project",
    name: project.name || "Untitled Website",
    pages: project.pages.map((page, index) => {
      const id = page.id || `page-${index + 1}`;
      const name = page.name || `Page ${index + 1}`;
      const fallbackRoute = index === 0 ? "/" : `/${slugify(name, id)}`;
      let route = page.route || fallbackRoute;

      if (!route.startsWith("/")) {
        route = `/${route}`;
      }

      if (usedRoutes.has(route)) {
        route = `${route}-${index + 1}`;
      }

      usedRoutes.add(route);

      const frame =
        !page.frame ||
        page.frame.width < FRAME_WIDTH ||
        page.frame.height < FRAME_HEIGHT
          ? frames[index]
          : page.frame;

      return {
        id,
        name,
        route,
        tree: assignMissingNodeIds(page.tree),
        frame,
      };
    }),
  };
}

export function findPageById(
  project: WebsiteProject,
  pageId: string | null,
): WebsitePage | null {
  if (!pageId) {
    return null;
  }

  return project.pages.find((page) => page.id === pageId) ?? null;
}

export function updatePageById(
  project: WebsiteProject,
  pageId: string,
  patch: Partial<Omit<WebsitePage, "id">>,
): WebsiteProject {
  return {
    ...project,
    pages: project.pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            ...patch,
          }
        : page,
    ),
  };
}

export function updatePageTreeById(
  project: WebsiteProject,
  pageId: string,
  nextTree: WebsitePage["tree"],
): WebsiteProject {
  return updatePageById(project, pageId, { tree: nextTree });
}

export function updateNodePropsInPage(
  project: WebsiteProject,
  pageId: string,
  nodeId: string,
  props: Partial<UIElementProps>,
): WebsiteProject {
  const page = findPageById(project, pageId);

  if (!page) {
    return project;
  }

  return updatePageTreeById(
    project,
    pageId,
    updateNodePropsById(page.tree, nodeId, props),
  );
}

export function updatePageFrame(
  project: WebsiteProject,
  pageId: string,
  frame: Partial<PageFrame>,
): WebsiteProject {
  return {
    ...project,
    pages: project.pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            frame: {
              ...page.frame,
              ...frame,
            },
          }
        : page,
    ),
  };
}
