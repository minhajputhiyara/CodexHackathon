import type { UIElementNode, UIElementProps } from "@/lib/ui-schema";
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

function createUniquePageId(project: WebsiteProject, baseId: string) {
  const usedIds = new Set(project.pages.map((page) => page.id));
  let index = 0;
  let nextId = baseId;

  while (usedIds.has(nextId)) {
    index += 1;
    nextId = `${baseId}-${index + 1}`;
  }

  return nextId;
}

function createUniqueRoute(
  project: WebsiteProject,
  route: string,
  suffix?: string,
) {
  const usedRoutes = new Set(project.pages.map((page) => page.route));
  const baseRoute =
    suffix === undefined
      ? route
      : route === "/"
        ? `/${suffix}`
        : `${route.replace(/\/$/, "")}-${suffix}`;
  let index = 1;
  let nextRoute = baseRoute;

  while (usedRoutes.has(nextRoute)) {
    index += 1;
    nextRoute = `${baseRoute}-${index}`;
  }

  return nextRoute;
}

function createBlankPage(pageId: string, name: string, route: string): WebsitePage {
  return {
    id: pageId,
    name,
    route,
    frame: layoutFrames(1)[0],
    tree: {
      id: `${pageId}-root`,
      type: "section",
      props: {
        className: "min-h-screen bg-white px-8 py-16 text-slate-950",
      },
      children: [
        {
          id: `${pageId}-container`,
          type: "container",
          props: {
            className: "mx-auto max-w-4xl",
          },
          children: [
            {
              id: `${pageId}-headline`,
              type: "text",
              props: {
                text: name,
                className: "text-4xl font-bold tracking-normal",
              },
            },
            {
              id: `${pageId}-body`,
              type: "text",
              props: {
                text: "Start designing this page.",
                className: "mt-4 text-base leading-7 text-slate-600",
              },
            },
          ],
        },
      ],
    },
  };
}

export function addPageToProject(
  project: WebsiteProject,
): { project: WebsiteProject; pageId: string } {
  const pageNumber = project.pages.length + 1;
  const pageName = `Page ${pageNumber}`;
  const pageId = createUniquePageId(project, slugify(pageName, `page-${pageNumber}`));
  const route = createUniqueRoute(project, `/${pageId}`);
  const frames = layoutFrames(project.pages.length + 1);
  const nextPage = {
    ...createBlankPage(pageId, pageName, route),
    frame: frames[frames.length - 1],
  };

  return {
    project: {
      ...project,
      pages: [...project.pages, nextPage],
    },
    pageId,
  };
}

function cloneNodeWithFreshIds(node: UIElementNode, suffix: string): UIElementNode {
  return {
    ...node,
    id: `${node.id}-${suffix}`,
    children: node.children?.map((child) => cloneNodeWithFreshIds(child, suffix)),
  };
}

export function duplicatePageById(
  project: WebsiteProject,
  pageId: string,
): { project: WebsiteProject; pageId: string } {
  const pageIndex = project.pages.findIndex((page) => page.id === pageId);

  if (pageIndex === -1) {
    return { project, pageId };
  }

  const sourcePage = project.pages[pageIndex];
  const nextPageId = createUniquePageId(project, `${sourcePage.id}-copy`);
  const suffix = nextPageId.replace(/[^a-z0-9-]/gi, "");
  const nextPage: WebsitePage = {
    ...sourcePage,
    id: nextPageId,
    name: `${sourcePage.name} Copy`,
    route: createUniqueRoute(project, sourcePage.route),
    tree: cloneNodeWithFreshIds(sourcePage.tree, suffix),
    frame: {
      ...sourcePage.frame,
      x: sourcePage.frame.x + 96,
      y: sourcePage.frame.y + 96,
    },
  };

  return {
    project: {
      ...project,
      pages: [
        ...project.pages.slice(0, pageIndex + 1),
        nextPage,
        ...project.pages.slice(pageIndex + 1),
      ],
    },
    pageId: nextPageId,
  };
}

export function deletePageById(
  project: WebsiteProject,
  pageId: string,
): { project: WebsiteProject; pageId: string | null } {
  if (project.pages.length <= 1) {
    return { project, pageId };
  }

  const pageIndex = project.pages.findIndex((page) => page.id === pageId);

  if (pageIndex === -1) {
    return { project, pageId: project.pages[0]?.id ?? null };
  }

  const nextPages = project.pages.filter((page) => page.id !== pageId);
  const nextSelectedPage =
    nextPages[Math.min(pageIndex, nextPages.length - 1)] ?? nextPages[0] ?? null;

  return {
    project: {
      ...project,
      pages: nextPages,
    },
    pageId: nextSelectedPage?.id ?? null,
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
