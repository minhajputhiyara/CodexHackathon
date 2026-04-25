import type { UIElementNode } from "@/lib/ui-schema";
import type { WebsiteProject } from "@/lib/website-project-schema";
import { layoutFrames, normalizeProject } from "@/lib/website-project";

function text(id: string, value: string, className: string): UIElementNode {
  return {
    id,
    type: "text",
    props: {
      text: value,
      className,
    },
  };
}

function button(id: string, value: string): UIElementNode {
  return {
    id,
    type: "button",
    props: {
      text: value,
      className:
        "rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white",
    },
  };
}

function pageTree(pageId: string, title: string, body: string): UIElementNode {
  return {
    id: `${pageId}-root`,
    type: "section",
    props: {
      className: "min-h-[1100px] bg-white px-16 py-20",
    },
    children: [
      {
        id: `${pageId}-hero`,
        type: "container",
        props: {
          className:
            "mx-auto flex max-w-5xl flex-col items-start gap-6 text-left",
        },
        children: [
          text(
            `${pageId}-eyebrow`,
            "UIForge",
            "text-sm font-semibold uppercase text-teal-700",
          ),
          text(`${pageId}-headline`, title, "text-6xl font-bold text-slate-950"),
          text(
            `${pageId}-subhead`,
            body,
            "max-w-3xl text-xl leading-8 text-slate-600",
          ),
          button(`${pageId}-cta`, "Start building"),
        ],
      },
      {
        id: `${pageId}-cards`,
        type: "stack",
        props: {
          className: "mx-auto mt-16 grid max-w-5xl gap-4 md:grid-cols-3",
        },
        children: [
          {
            id: `${pageId}-card-1`,
            type: "card",
            props: {
              className: "rounded-md border border-slate-200 bg-slate-50 p-6",
            },
            children: [
              text(`${pageId}-card-1-title`, "Prompt", "text-lg font-bold"),
              text(
                `${pageId}-card-1-body`,
                "Describe a page or full website in natural language.",
                "mt-3 text-base leading-7 text-slate-600",
              ),
            ],
          },
          {
            id: `${pageId}-card-2`,
            type: "card",
            props: {
              className: "rounded-md border border-slate-200 bg-slate-50 p-6",
            },
            children: [
              text(`${pageId}-card-2-title`, "Edit", "text-lg font-bold"),
              text(
                `${pageId}-card-2-body`,
                "Select real rendered elements and tune their content.",
                "mt-3 text-base leading-7 text-slate-600",
              ),
            ],
          },
          {
            id: `${pageId}-card-3`,
            type: "card",
            props: {
              className: "rounded-md border border-slate-200 bg-slate-50 p-6",
            },
            children: [
              text(`${pageId}-card-3-title`, "Export", "text-lg font-bold"),
              text(
                `${pageId}-card-3-body`,
                "Export React and Tailwind code from the same JSON tree.",
                "mt-3 text-base leading-7 text-slate-600",
              ),
            ],
          },
        ],
      },
    ],
  };
}

const frames = layoutFrames(4);

export const sampleWebsiteProject: WebsiteProject = normalizeProject({
  id: "uiforge-sample",
  name: "UIForge SaaS Site",
  pages: [
    {
      id: "home",
      name: "Home",
      route: "/",
      frame: frames[0],
      tree: pageTree(
        "home",
        "Build faster with AI",
        "Generate a real editable website from a prompt, review every page in one workspace, and export production-friendly React.",
      ),
    },
    {
      id: "pricing",
      name: "Pricing",
      route: "/pricing",
      frame: frames[1],
      tree: pageTree(
        "pricing",
        "Plans that scale with your team",
        "Compare simple pricing options for teams that want AI-native UI creation without design tool overhead.",
      ),
    },
    {
      id: "about",
      name: "About",
      route: "/about",
      frame: frames[2],
      tree: pageTree(
        "about",
        "A canvas built for generated interfaces",
        "UIForge keeps AI output structured, editable, and exportable instead of flattening work into static images.",
      ),
    },
    {
      id: "contact",
      name: "Contact",
      route: "/contact",
      frame: frames[3],
      tree: pageTree(
        "contact",
        "Bring UIForge to your next product sprint",
        "Share a brief, generate a site, edit the details, and hand off clean React with Tailwind.",
      ),
    },
  ],
});

