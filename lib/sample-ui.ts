import type { UIElementNode } from "@/lib/ui-schema";

export const sampleUiTree: UIElementNode = {
  id: "root",
  type: "section",
  props: {
    className: "min-h-[360px] rounded-md bg-white px-8 py-16",
  },
  children: [
    {
      id: "hero-container",
      type: "container",
      props: {
        className: "mx-auto flex max-w-3xl flex-col items-center gap-5 text-center",
      },
      children: [
        {
          id: "eyebrow",
          type: "text",
          props: {
            text: "UIForge",
            className: "text-sm font-semibold uppercase text-teal-700",
          },
        },
        {
          id: "headline",
          type: "text",
          props: {
            text: "Build faster with AI",
            className: "text-4xl font-bold text-slate-950",
          },
        },
        {
          id: "subhead",
          type: "text",
          props: {
            text: "Generate a real editable UI from a prompt, tune the details, and export React with Tailwind.",
            className: "max-w-2xl text-base leading-7 text-slate-600",
          },
        },
        {
          id: "cta",
          type: "button",
          props: {
            text: "Get Started",
            className: "rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white",
          },
        },
      ],
    },
    {
      id: "feature-stack",
      type: "stack",
      props: {
        className: "mx-auto mt-8 grid max-w-3xl gap-3 md:grid-cols-3",
      },
      children: [
        {
          id: "feature-1",
          type: "card",
          props: {
            className: "rounded-md border border-slate-200 bg-slate-50 p-4 text-left",
          },
          children: [
            {
              id: "feature-1-title",
              type: "text",
              props: {
                text: "Prompt",
                className: "text-sm font-bold text-slate-900",
              },
            },
            {
              id: "feature-1-body",
              type: "text",
              props: {
                text: "Describe the UI you need.",
                className: "mt-2 text-sm text-slate-600",
              },
            },
          ],
        },
        {
          id: "feature-2",
          type: "card",
          props: {
            className: "rounded-md border border-slate-200 bg-slate-50 p-4 text-left",
          },
          children: [
            {
              id: "feature-2-title",
              type: "text",
              props: {
                text: "Edit",
                className: "text-sm font-bold text-slate-900",
              },
            },
            {
              id: "feature-2-body",
              type: "text",
              props: {
                text: "Select elements and tune text or classes.",
                className: "mt-2 text-sm text-slate-600",
              },
            },
          ],
        },
        {
          id: "feature-3",
          type: "card",
          props: {
            className: "rounded-md border border-slate-200 bg-slate-50 p-4 text-left",
          },
          children: [
            {
              id: "feature-3-title",
              type: "text",
              props: {
                text: "Export",
                className: "text-sm font-bold text-slate-900",
              },
            },
            {
              id: "feature-3-body",
              type: "text",
              props: {
                text: "Ship React and Tailwind code.",
                className: "mt-2 text-sm text-slate-600",
              },
            },
          ],
        },
      ],
    },
  ],
};
