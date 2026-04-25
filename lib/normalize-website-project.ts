import { normalizeUiTree } from "@/lib/normalize-ui-tree";
import { sampleWebsiteProject } from "@/lib/sample-website-project";
import { normalizeProject } from "@/lib/website-project";
import type { WebsitePage, WebsiteProject } from "@/lib/website-project-schema";

const MAX_PAGES = 6;

type NormalizeProjectResult =
  | {
      ok: true;
      project: WebsiteProject;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fallbackPage(index: number) {
  return sampleWebsiteProject.pages[index % sampleWebsiteProject.pages.length];
}

export function normalizeWebsiteProject(
  value: unknown,
): NormalizeProjectResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: "Generated website project must be an object.",
    };
  }

  if (!Array.isArray(value.pages) || value.pages.length === 0) {
    return {
      ok: false,
      error: "Generated website project must include at least one page.",
    };
  }

  const pages: WebsitePage[] = value.pages
    .slice(0, MAX_PAGES)
    .map((rawPage, index) => {
      const safeFallbackPage = fallbackPage(index);

      if (!isRecord(rawPage)) {
        return {
          ...safeFallbackPage,
          id: `page-${index + 1}`,
        };
      }

      const normalizedTree = normalizeUiTree(rawPage.tree);
      const tree = normalizedTree.ok
        ? normalizedTree.tree
        : safeFallbackPage.tree;

      return {
        id:
          typeof rawPage.id === "string" && rawPage.id
            ? rawPage.id
            : `page-${index + 1}`,
        name:
          typeof rawPage.name === "string" && rawPage.name
            ? rawPage.name
            : safeFallbackPage.name,
        route:
          typeof rawPage.route === "string" && rawPage.route
            ? rawPage.route
            : safeFallbackPage.route,
        frame: safeFallbackPage.frame,
        tree,
      };
    });

  return {
    ok: true,
    project: normalizeProject({
      id:
        typeof value.id === "string" && value.id ? value.id : "generated-site",
      name:
        typeof value.name === "string" && value.name
          ? value.name
          : "Generated Website",
      pages,
    }),
  };
}

